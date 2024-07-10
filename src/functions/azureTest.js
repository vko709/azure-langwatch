import { app } from '@azure/functions';
import { LangWatch } from 'langwatch';
import { OpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import dotenv from 'dotenv';

dotenv.config();

app.http('azureTest', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);
		const name = request.query.get('name') || await request.text() || 'world';
		const body = JSON.parse(name)
        const template = body.prompt;
		const persona = body.persona;

        try {
            const langwatch = new LangWatch({
                apiKey: process.env.LANGWATCH_API_KEY
            });
			const d = new Date();

            const trace = langwatch.getTrace({
                metadata: { threadId: d.getTime(), userId: "userID" },
            });

            trace.update({
                metadata: { labels: ["customer-support"] },
            });

            const outputParser = new StringOutputParser();

            const model = new OpenAI({
                openAIApiKey: process.env.OPEN_API_KEY,
                temperature: 0
            });

            const prompt = ChatPromptTemplate.fromTemplate(template);

            const chain = prompt.pipe(model).pipe(outputParser);

            // Add error handling around the invoke call
            try {
                const res = await chain.invoke({ product: persona, adjective: "funny" });
                context.log("Response from chain.invoke:", res);
				return { body: `${res}` };
            } catch (invokeError) {
                context.log("Error during chain.invoke:", invokeError);
                return { status: 500, body: `Error during chain.invoke: ${invokeError.message}` };
            }

            // return { body: `Response from LangWatch: ${name}` };

        } catch (error) {
            context.log("Error in handler:", error);
            return { status: 500, body: `Internal server error: ${error.message}` };
        }
    }
});
