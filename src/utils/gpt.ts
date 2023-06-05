import { OpenAIApi, Configuration, CreateChatCompletionRequest, ChatCompletionRequestMessage } from 'openai';
import keys from '../keys'

export class ChatGPTClient {
    private openAI: OpenAIApi

    constructor() {
        const configuration = new Configuration({
            organization: "org-rd12gPEDCdBDHeTBABDhFv5u",
            apiKey: `${keys.openAiApiKey}`,
        })
        this.openAI = new OpenAIApi(configuration)
    }

    async respond(chatGPTMessages: Array<ChatCompletionRequestMessage>) {
        try {
            if (!chatGPTMessages) {
                return {
                    text: 'No messages provided.'
                }
            }

            const request: CreateChatCompletionRequest = {
                messages: chatGPTMessages,
                model: 'gpt-3.5-turbo',
            }

            const response = await this.openAI.createChatCompletion(request)
            if (!response.data || !response.data.choices) {
                return {
                    text: 'No response from OpenAI.'
                }
            }

            return {
                text: response.data.choices[0].message?.content,
                messageId: response.data.id,
            }
        } catch (error) {
            console.log(error)
        }
    }
}