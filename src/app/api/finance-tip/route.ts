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
  "An investment in knowledge pays the best interest",
  "The quickest way to double your money is to fold it in half and put it back in your pocket",
  "Beware of little expenses; a small leak will sink a great ship",
  "Do not save what is left after spending, but spend what is left after saving",
  "The rich invest in time, the poor invest in money",
  "It's not your salary that makes you rich, it's your spending habits",
  "The more you learn, the more you earn",
  "Money grows on the tree of persistence",
  "Live below your means but within your needs",
  "The best investment you can make is in yourself",
  "Financial freedom is available to those who learn about it and work for it",
  "Don't work for money, make money work for you",
  "The stock market is a device for transferring money from the impatient to the patient",
  "Risk comes from not knowing what you're doing",
  "Never depend on a single income, make investment to create a second source",
  "The person who doesn't know where his next dollar is coming from usually doesn't know where his last dollar went",
  "Investing should be more like watching paint dry or watching grass grow",
  "Time is more valuable than money. You can get more money, but you cannot get more time",
  "Savings without a mission is just procrastination",
  "Every time you borrow money, you're robbing your future self",
  "A simple fact that is hard to learn is that the time to save money is when you have some",
  "Wealth consists not in having great possessions, but in having few wants",
  "Your net worth to the world is usually determined by what remains after your bad habits are subtracted",
  "Money saved is money earned with zero risk",
  "The first step to getting rich is not about making money, it's about making less poor decisions",
  "Budgeting isn't about limiting yourself - it's about making the things that excite you possible",
  "Don't tell me what you value, show me your budget, and I'll tell you what you value",
  "A budget tells us what we can't afford, but it doesn't keep us from buying it",
  "Stop buying things you don't need, to impress people you don't even like",
  "The art is not in making money, but in keeping it",
  "Wealth is the ability to fully experience life",
  "Before you speak, listen. Before you spend, earn. Before you invest, investigate",
  "Formal education will make you a living; self-education will make you a fortune",
  "The secret to wealth is simple: Find a way to do more for others than anyone else does",
  "Don't let your learning lead to knowledge, let it lead to action",
  "Expect the best, prepare for the worst, capitalize on what comes",
  "Money is multiplied in practical value depending on the number of W's you control - what you do, when you do it, where you do it, and with whom you do it"
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
