// Any setup scripts you might need go here

// Load .env files
import 'dotenv/config'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
