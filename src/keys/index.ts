import { Keys } from '../types'

// Get the keys from the environment variables
const keys: Keys = {
    clientToken: process.env.CLIENT_TOKEN ?? 'nil',
    testGuild: process.env.TEST_GUILD ?? 'nil',
    auditChannel: process.env.AUDIT_CHANNEL ?? 'nil',
    openAiApiKey: process.env.OPENAI_API_KEY ?? 'nil',
    version: process.env.VERSION ?? 'nil',
}

// Check if any of the keys are missing
if (Object.values(keys).includes('nil')) {
    throw new Error('Missing environment variables')
}

export default keys