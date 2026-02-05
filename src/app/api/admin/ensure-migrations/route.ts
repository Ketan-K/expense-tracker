import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { addCorsHeaders } from "@/lib/cors";
import fs from "fs";
import path from "path";
import { Client } from "pg";

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    await requireAdmin();
  } catch (error: any) {
    const response = NextResponse.json(
      { error: error.message },
      { status: error.message.includes("Unauthorized") ? 401 : 403 }
    );
    return addCorsHeaders(response, request.headers.get("origin"));
  }

  try {
    // Get database connection string
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Database connection not configured",
          message: "DATABASE_URL environment variable is not set",
        },
        { status: 500 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    // Read all migration files from supabase/migrations directory
    const migrationsDir = path.join(process.cwd(), "supabase", "migrations");

    if (!fs.existsSync(migrationsDir)) {
      const response = NextResponse.json(
        {
          success: false,
          error: "Migrations directory not found",
          message: "The supabase/migrations directory does not exist",
        },
        { status: 404 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(file => file.endsWith(".sql"))
      .sort(); // Execute in alphabetical order

    if (migrationFiles.length === 0) {
      const response = NextResponse.json({
        success: true,
        migrations: [],
        successCount: 0,
        failureCount: 0,
        message: "No migration files found",
      });
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    // Connect to database
    const client = new Client({
      connectionString: databaseUrl,
    });

    await client.connect();

    const results = [];

    try {
      // Create migrations tracking table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          filename TEXT NOT NULL UNIQUE,
          executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          checksum TEXT
        );
        
        CREATE INDEX IF NOT EXISTS idx_schema_migrations_filename 
        ON schema_migrations(filename);
      `);

      // Get list of already executed migrations
      const executedResult = await client.query("SELECT filename FROM schema_migrations");
      const executedMigrations = new Set(executedResult.rows.map((row: any) => row.filename));

      // Execute each migration
      for (const file of migrationFiles) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, "utf-8");

        // Check if migration was already executed
        if (executedMigrations.has(file)) {
          results.push({
            file,
            success: true,
            skipped: true,
            lines: sql.split("\n").length,
            message: "Already executed, skipped",
          });
          continue;
        }

        try {
          // Execute the SQL
          await client.query(sql);

          // Record successful migration
          await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);

          results.push({
            file,
            success: true,
            skipped: false,
            lines: sql.split("\n").length,
          });
        } catch (error: any) {
          results.push({
            file,
            success: false,
            skipped: false,
            error: error.message,
            detail: error.detail || null,
            hint: error.hint || null,
          });
        }
      }
    } finally {
      // Always close the connection
      await client.end();
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const skippedCount = results.filter(r => r.skipped).length;
    const executedCount = results.filter(r => r.success && !r.skipped).length;

    const response = NextResponse.json({
      success: failureCount === 0,
      migrations: results,
      successCount,
      failureCount,
      skippedCount,
      executedCount,
      message:
        failureCount === 0
          ? `${executedCount > 0 ? `Executed ${executedCount} new migration(s)` : "No new migrations to execute"}${skippedCount > 0 ? `, ${skippedCount} already applied` : ""}`
          : `Executed ${executedCount} migration(s), ${failureCount} failed${skippedCount > 0 ? `, ${skippedCount} skipped` : ""}`,
    });

    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error: any) {
    const response = NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "Failed to execute migrations",
      },
      { status: 500 }
    );
    return addCorsHeaders(response, request.headers.get("origin"));
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    await requireAdmin();
  } catch (error: any) {
    const response = NextResponse.json(
      { error: error.message },
      { status: error.message.includes("Unauthorized") ? 401 : 403 }
    );
    return addCorsHeaders(response, request.headers.get("origin"));
  }

  try {
    // List available migration files
    const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(file => file.endsWith(".sql"))
      .sort();

    const migrations = migrationFiles.map(file => {
      const filePath = path.join(migrationsDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        modified: stats.mtime,
      };
    });

    const response = NextResponse.json({
      migrations,
      total: migrations.length,
    });

    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error: any) {
    const response = NextResponse.json({ error: error.message }, { status: 500 });
    return addCorsHeaders(response, request.headers.get("origin"));
  }
}
