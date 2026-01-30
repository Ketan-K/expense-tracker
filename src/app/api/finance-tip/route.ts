import { NextResponse } from "next/server";

const financeTips = [
  "A budget is telling your money where to go instead of wondering where it went",
  "Save money and money will save you",
  "It's not about how much you make, but how much you keep",
  "Every rupee saved is a rupee earned",
  "Track your expenses, master your money",
  "Small daily savings lead to big financial gains",
  "The best time to save was yesterday, the next best time is now",
  "Financial freedom starts with tracking every expense",
  "Your budget is your roadmap to financial success",
  "Invest in yourself by managing your money wisely",
  "Wealth is built one smart decision at a time",
  "Know where your money goes to make it grow",
  "Financial discipline today, freedom tomorrow",
  "Budget like your future depends on it - because it does",
  "Every expense tracked is a step toward financial clarity",
  "Compound interest is the eighth wonder of the world",
  "Don't save what is left after spending; spend what is left after saving",
  "The goal isn't more money, it's living life on your terms",
  "A penny saved is a penny earned",
  "Rich people stay rich by living like they're poor. Poor people stay poor by living like they're rich",
  "Financial peace isn't the acquisition of stuff, it's learning to live on less than you make",
  "Money is a terrible master but an excellent servant",
  "The habit of saving is itself an education",
  "Too many people spend money they haven't earned to buy things they don't want to impress people they don't like",
  "An investment in knowledge pays the best interest"
];

export async function GET() {
  try {
    // You can extend this to fetch from Google Sheets API or other sources
    // For now, returning a random tip from our collection
    const randomTip = financeTips[Math.floor(Math.random() * financeTips.length)];
    
    return NextResponse.json({
      tip: randomTip,
      source: "Finance Wisdom"
    });
  } catch (error) {
    console.error("Error fetching finance tip:", error);
    return NextResponse.json(
      { tip: "Track your expenses, master your money", source: "Default" },
      { status: 500 }
    );
  }
}
