import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const names = [
    "Matcha Cam Nha Đam",
    "Matcha Xoài",
    "Matcha Dâu",
    "Matcha Kiwi",
    "Matcha Việt Quốc",
];

async function main() {
    await mongoose.connect(process.env.MONGODB_URI!);
    const db = mongoose.connection.db!;

    for (const name of names) {
        const dish = await db.collection("dishes").findOne({ name: new RegExp(name, "i") });
        const recipe = dish
            ? await db.collection("dishrecipes").findOne({ dishId: dish._id, isActive: true })
            : null;
        console.log(
            `${name} => ${dish?._id?.toString() || "NO DISH"} | recipe: ${recipe ? "YES" : "NO"}`
        );
    }

    const source = await db.collection("dishes").findOne({ name: /Matcha Cam Nha/i });
    if (source) {
        const recipe = await db.collection("dishrecipes").findOne({ dishId: source._id });
        console.log("\n=== SOURCE RECIPE ===");
        console.log(JSON.stringify(recipe, null, 2));
    }

    await mongoose.disconnect();
}

main().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
});
