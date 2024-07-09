import { app } from '@azure/functions';
import { LangWatch } from 'langwatch';
import { OpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import dotenv from 'dotenv';


// require('dotenv').config();

// const openai = async () => {
//   const { OpenAI } = await import('@langchain/openai');
// 	const openai = new OpenAI({
//     openAIApiKey: process.env.OPEN_API_KEY,
// 		temperature : 0.9
//   });
// 	return openai;
// };


dotenv.config();
app.http('azureTest', {
	methods: ['POST'],
	authLevel: 'anonymous',
	handler: async (request, context) => {
		context.log(`Http function processed request for url "${request.url}"`);

		const langwatch = new LangWatch({
			apiKey: process.env.LANGWATCH_API_KEY
		});

		const trace = langwatch.getTrace({
			metadata: { threadId: "mythread-123", userId: "myuser-123" },
		});

		trace.update({
			metadata: { labels: ["customer-support"] },
		});

		const outputParser = new StringOutputParser();

		// const config = new Configuration({
		// 	apiKey : OPEN_API_KEY
		// })

		// const model = new OpenAIApi(config);
		const model = new OpenAI({
			openAIApiKey: process.env.OPEN_API_KEY,
			temperature : 0.9
	})

		// console.log("new config is \n" , config);

		const template = "How to learn python?";

		const prompt = ChatPromptTemplate.fromTemplate(template);

		const chain = prompt.pipe(model).pipe(outputParser);

		const res = await chain.invoke({product: "colorful socks", adjective: "funny" });

		const name = request.query.get('name') || await request.text() || 'world';

		// return { body: `Hello, ${name}!` };
		const key1 = process.env.OPEN_API_KEY
		return { body: `response of langwatch ${res}` };
	}
});
