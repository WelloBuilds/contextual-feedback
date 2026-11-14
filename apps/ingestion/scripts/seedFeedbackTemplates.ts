import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { feedbackTemplates } from "../src/models/feedbackTemplates.model";
import { workspaces } from "../src/models/workspace.model";
import { PatternType } from "../src/features/episodes/enums/patternType";


const defaultTemplates = [
    {
        patternType: PatternType.rageClicks,
        question: "What made you click repeatedly?",
        options: [
            "Nothing happened when I clicked once",
            "The response was taking too long",
            "I wasn't sure whether my click was registered",
            "I expected something different to happen",
        ],
    },
    {
        patternType: PatternType.errorAfterClick,
        question: "What prevented you from completing your action?",
        options: [
            "Something went wrong or an error appeared",
            "The action didn't produce the expected result",
            "I couldn't complete the action because something was missing",
            "Something else",
        ],
    },
];


async function seedFeedbackTemplates() {
	const workspaceList = await db.select({ id: workspaces.id }).from(workspaces);
	let insertedCount = 0;

	for (const workspace of workspaceList) {
		const existingTemplates = await db.select({ patternType: feedbackTemplates.patternType })
			.from(feedbackTemplates)
			.where(eq(feedbackTemplates.workspaceId, workspace.id));
		const existingTypes = new Set(existingTemplates.map((template) => template.patternType));
		const missingTemplates = defaultTemplates.filter((template) => !existingTypes.has(template.patternType));

		if (missingTemplates.length > 0) {
			await db.insert(feedbackTemplates).values(missingTemplates.map((template) => ({
				...template,
				workspaceId: workspace.id,
			})));
			insertedCount += missingTemplates.length;
		}
	}

	console.log(`Added ${insertedCount} feedback template(s) across ${workspaceList.length} workspace(s).`);
}

seedFeedbackTemplates()
	.catch((error) => {
		console.error("Failed to seed feedback templates", error);
		process.exitCode = 1;
	})
	.finally(() => db.$client.end());
