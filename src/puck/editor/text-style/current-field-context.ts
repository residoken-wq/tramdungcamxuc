import { createContext, useContext } from 'react'

export const CurrentFieldContext = createContext<string | undefined>(undefined)

export function useCurrentField(): string | undefined {
  return useContext(CurrentFieldContext)
}

