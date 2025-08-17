import { z } from 'zod';

export interface Reward {
    id: number;
    name: string;
    description: string;
    cost: number;
    icon: string;
}

export interface RewardCategory {
    title: string;
    description: string;
    color: string;
    rewards: Reward[];
}

export const UserRewardSchema = z.object({
    id: z.string(),
    userId: z.string(),
    rewardId: z.number(),
    name: z.string(),
    description: z.string(),
    icon: z.string(),
    cost: z.number(),
    status: z.enum(['unclaimed', 'claimed']),
    redeemedAt: z.any(), // Firestore Timestamp
    claimedAt: z.any().optional(), // Firestore Timestamp
});
export type UserReward = z.infer<typeof UserRewardSchema>;

export const REWARD_CATEGORIES: RewardCategory[] = [
    {
        title: "🟢 25 Coins – Quick Wins",
        description: "Encourages consistency with tiny but rewarding breaks.",
        color: "#22c55e",
        rewards: [
            { id: 1, name: "Mindful Break", description: "Take a 10-min mindful break (no screens).", cost: 25, icon: "🧠" },
            { id: 2, name: "Favorite Song", description: "Listen to your favorite song guilt-free.", cost: 25, icon: "🎵" },
            { id: 3, name: "Funny Video", description: "Watch a funny short video.", cost: 25, icon: "😂" },
            { id: 4, name: "Gratitude Moment", description: "Write 3 things you’re grateful for today.", cost: 25, icon: "🙏" },
            { id: 5, name: "Snack Time", description: "Drink your favorite coffee/tea/snack.", cost: 25, icon: "☕" },
            { id: 6, name: "Thank You Text", description: "Send a “thank you” text to a friend.", cost: 25, icon: "📱" },
            { id: 7, name: "Desk Stretch", description: "5-min desk exercise/stretch.", cost: 25, icon: "💪" },
            { id: 8, name: "Fresh Air", description: "Step outside for fresh air.", cost: 25, icon: "🌿" },
            { id: 9, name: "Meme Scroll", description: "Scroll memes guilt-free for 5 mins.", cost: 25, icon: "🤪" },
            { id: 10, name: "Declutter One Item", description: "Declutter 1 small item from your desk.", cost: 25, icon: "✨" },
        ]
    },
    {
        title: "🟡 50 Coins – Medium Boost",
        description: "Rewards that make you smarter or happier in short bursts.",
        color: "#f59e0b",
        rewards: [
            { id: 11, name: "TED Talk", description: "Watch a TED Talk / motivational video.", cost: 50, icon: "🎤" },
            { id: 12, name: "Brain Game", description: "Play a 10-min brain game (chess, sudoku, puzzle).", cost: 50, icon: "🧩" },
            { id: 13, name: "Read a Book", description: "Read 5 pages of a book.", cost: 50, icon: "📖" },
            { id: 14, name: "Power Nap", description: "Take a power nap (20 min).", cost: 50, icon: "😴" },
            { id: 15, name: "Journal Wins", description: "Journal your day’s wins.", cost: 50, icon: "🏆" },
            { id: 16, name: "Quick Doodle", description: "Draw/sketch something random.", cost: 50, icon: "🎨" },
            { id: 17, name: "Breathing Technique", description: "Try a new breathing technique.", cost: 50, icon: "😮‍💨" },
            { id: 18, name: "Plan Tomorrow", description: "Plan tomorrow in a mini-list.", cost: 50, icon: "📝" },
            { id: 19, name: "Fun Fact Quiz", description: "Try a fun fact quiz.", cost: 50, icon: "🤔" },
            { id: 20, name: "Speed Typing", description: "Practice 5 min of speed typing.", cost: 50, icon: "⌨️" },
        ]
    },
    {
        title: "🟠 75 Coins – Big Engagement",
        description: "Rewards that feel more significant, mixing fun + relationships.",
        color: "#f97316",
        rewards: [
            { id: 21, name: "Friend/Family Call", description: "Schedule 30 min family/friend call.", cost: 75, icon: "📞" },
            { id: 22, name: "Watch an Episode", description: "Watch an episode of your favorite series guilt-free.", cost: 75, icon: "📺" },
            { id: 23, name: "Try a New Recipe", description: "Try a new recipe/snack at home.", cost: 75, icon: "👨‍🍳" },
            { id: 24, name: "Online Game", description: "Play an online multiplayer game.", cost: 75, icon: "🎮" },
            { id: 25, name: "Hobby Time", description: "Spend 30 min on your hobby (music, art, etc.).", cost: 75, icon: "❤️" },
            { id: 26, name: "Vision Board Update", description: "Do a vision board update (goals visualization).", cost: 75, icon: "🎯" },
            { id: 27, name: "Share Learnings", description: "Write a small blog / post to share your learnings.", cost: 75, icon: "✍️" },
            { id: 28, name: "Solo Walk", description: "Take yourself on a solo walk with music.", cost: 75, icon: "🚶" },
            { id: 29, name: "Workout Challenge", description: "Try a new workout challenge.", cost: 75, icon: "🏋️" },
            { id: 30, name: "Screen-Free Dinner", description: "Have a screen-free dinner with family.", cost: 75, icon: "🍽️" },
        ]
    },
    {
        title: "🔴 100 Coins – Premium Experiences",
        description: "Powerful non-monetary rewards that feel premium but cost nothing.",
        color: "#ef4444",
        rewards: [
            { id: 31, name: "Movie Night", description: "Movie night (solo/family).", cost: 100, icon: "🎬" },
            { id: 32, name: "Weekend Half-Day Off", description: "Block calendar for a half-day off guilt-free.", cost: 100, icon: "🗓️" },
            { id: 33, name: "Digital Detox", description: "Try a full “digital detox” for 2 hrs.", cost: 100, icon: "🔕" },
            { id: 34, name: "Letter to Future Self", description: "Write a personal letter to your future self.", cost: 100, icon: "✉️" },
            { id: 35, name: "Plan a Trip", description: "Plan your next short trip/outdoor activity.", cost: 100, icon: "✈️" },
            { id: 36, name: "Home Spa Session", description: "Do a home spa session (candles, music, relaxation).", cost: 100, icon: "🛀" },
            { id: 37, name: "Explore a Course", description: "Explore a new free online course/tutorial.", cost: 100, icon: "🎓" },
            { id: 38, name: "Gratitude Journal", description: "Create a gratitude video/journal for your week.", cost: 100, icon: "📔" },
            { id: 39, name: "Fun Challenge", description: "Do a fun challenge (e.g., 24-hr no sugar/junk).", cost: 100, icon: "🥇" },
            { id: 40, name: "Quality Time", description: "Spend quality time (1 hr) with family without distractions.", cost: 100, icon: "👨‍👩‍👧‍👦" },
        ]
    }
];
