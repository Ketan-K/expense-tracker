import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { addCorsHeaders } from "@/lib/cors";
import fs from "fs";
import path from "path";

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
    // Read all migration files from supabase/migrations directory
    const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
    
    if (!fs.existsSync(migrationsDir)) {
      const response = NextResponse.json(
        { 
          success: false,
          error: "Migrations directory not found",
          message: "The supabase/migrations directory does not exist" 
        },
        { status: 404 }
      );
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith(".sql"))
      .sort(); // Execute in alphabetical order

    if (migrationFiles.length === 0) {
      const response = NextResponse.json({
        success: true,
        migrations: [],
        totalFiles: 0,
        successCount: 0,
        failureCount: 0,
        message: "No migration files found",
      });
      return addCorsHeaders(response, request.headers.get("origin"));
    }

    // Read migration contents
    const migrations = migrationFiles.map(file => {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");
      return {
        file,
        sql,
        lines: sql.split("\n").length,
      };
    });

    const response = NextResponse.json({
      success: true,
      migrations: migrations.map(m => ({
        file: m.file,
        lines: m.lines,
        success: false,
        note: "To execute these migrations, copy the SQL and run in Supabase SQL Editor (Dashboard > SQL Editor)",
      })),
      totalFiles: migrations.length,
      successCount: 0,
      failureCount: 0,
      message: "Migration files loaded. These need to be executed manually in Supabase SQL Editor.",
      sqlContents: migrations.map(m => ({
        file: m.file,
        sql: m.sql,
      })),
    });

    return addCorsHeaders(response, request.headers.get("origin"));
  } catch (error: any) {
    const response = NextResponse.json(
      { 
        success: false,
        error: error.message,
        message: "Failed to read migration files" 
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
    const migrationFiles = fs.readdirSync(migrationsDir)
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
    const response = NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
    return addCorsHeaders(response, request.headers.get("origin"));
  }
}
