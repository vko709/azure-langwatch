import { app } from '@azure/functions';
import { LangWatch } from 'langwatch';
import { OpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import dotenv from 'dotenv';
import { SystemMessage } from '@langchain/core/messages';

dotenv.config();

app.http('azureTest', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);
        
        try {
            const requestBody = await request.text();
            const body = JSON.parse(requestBody);

            const template = body.prompt;
            const persona = body.persona;

            context.log(`Template: ${template}`);
            context.log(`Persona: ${persona}`);
            const real_tempalte = ChatPromptTemplate.fromMessages(
                [
                    new SystemMessage(persona),
                    HumanMessagePromptTemplate.fromTemplate(template)
                ]
            )


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
                temperature: 0,
                maxTokens: 2000
            });

            const message = SystemMessagePromptTemplate.fromTemplate(persona);
            // console.log(message);
            const chatPrompt = ChatPromptTemplate.fromMessages([
                ["user", template],
                message,
            ]);
            console.log("........",chatPrompt)
            const formattedChatPrompt = await chatPrompt.invoke({
                text: template,
            });

            const prompt = ChatPromptTemplate.fromTemplate(template);

            const chain = real_tempalte.pipe(model).pipe(outputParser);

            // Add error handling around the invoke call
            try {
                const res = await chain.invoke(formattedChatPrompt);
                context.log("Response from chain.invoke:", res);
                return { body: `${res}` };
            } catch (invokeError) {
                context.log("Error during chain.invoke:", invokeError);
                return { status: 500, body: `Error during chain.invoke: ${invokeError.message}` };
            }

        } catch (error) {
            context.log("Error in handler:", error);
            return { status: 500, body: `Internal server error: ${error.message}` };
        }
    }
});
