import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env file, where API keys and passwords are configured
config({ path: resolve(__dirname, '..', '.env') })

// Import the rest of our application.
import './client'