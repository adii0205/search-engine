/**
 * LLM Service
 * Handles LLM orchestration (Claude, Groq, Ollama)
 */

import Anthropic from '@anthropic-ai/sdk'
import { Groq } from 'groq-sdk'
import { getConfig } from '../config.js'

const config = getConfig()

const anthropic = new Anthropic({
  apiKey: config.ANTHROPIC_API_KEY,
})

const groq = new Groq({
  apiKey: config.GROQ_API_KEY || '',
})

interface RAGContext {
  sources: Array<{
    title: string
    url: string
    content: string
    score: number
  }>
}

export const llmService = {
  async generateAnswer(
    query: string,
    context: RAGContext
  ): Promise<{
    text: string
    sources: Array<{ title: string; url: string; excerpt: string }>
    processingTime: number
  }> {
    const startTime = Date.now()

    // Build prompt with context and source citations
    const sourcesText = context.sources
      .map(
        (s, i) =>
          `[${i + 1}] ${s.title}\nURL: ${s.url}\n${s.content.substring(0, 300)}`
      )
      .join('\n\n')

    const systemPrompt = `You are Nexus, an AI search assistant that provides comprehensive, factual answers.

Rules:
1. Always cite sources using [N] notation where N is the source number
2. Be concise and clear
3. Organize information with headers when appropriate
4. Highlight key takeaways
5. If uncertain about something, say so
6. Format answer as markdown`

    const userPrompt = `User Query: ${query}

Research Sources:
${sourcesText}

Please provide a comprehensive answer to the user's query using the sources above. Always cite sources with [1], [2], etc.`

    try {
      // Use Claude for reasoning
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      })

      const text =
        message.content[0]?.type === 'text'
          ? message.content[0].text
          : 'Unable to generate answer'

      return {
        text,
        sources: context.sources.slice(0, 5).map((s) => ({
          title: s.title,
          url: s.url,
          excerpt: s.content.substring(0, 150),
        })),
        processingTime: Date.now() - startTime,
      }
    } catch (error) {
      console.error('[LLM] Claude error:', error)

      // Fallback to Groq for speed
      if (config.GROQ_API_KEY) {
        return this.generateAnswerGroq(query, context, startTime)
      }

      // Last resort: compile answer from sources
      return {
        text: `Based on the search results:\n\n${context.sources.map((s, i) => `**[${i + 1}]** ${s.title}\n${s.content.substring(0, 200)}`).join('\n\n')}`,
        sources: context.sources.slice(0, 3).map((s) => ({
          title: s.title,
          url: s.url,
          excerpt: s.content.substring(0, 150),
        })),
        processingTime: Date.now() - startTime,
      }
    }
  },

  async generateAnswerGroq(
    query: string,
    context: RAGContext,
    startTime: number
  ): Promise<{
    text: string
    sources: Array<{ title: string; url: string; excerpt: string }>
    processingTime: number
  }> {
    try {
      const sourcesText = context.sources
        .map((s, i) => `[${i + 1}] ${s.title}: ${s.content.substring(0, 200)}`)
        .join('\n\n')

      const message = await groq.chat.completions.create({
        model: 'mixtral-8x7b-32768',
        max_tokens: 1024,
        messages: [
          {
            role: 'system',
            content:
              'You are Nexus, an AI search assistant. Always cite sources with [N] notation.',
          },
          {
            role: 'user',
            content: `Query: ${query}\n\nSources:\n${sourcesText}\n\nProvide a comprehensive answer with source citations.`,
          },
        ],
      })

      const text = message.choices[0]?.message?.content || 'No answer generated'

      return {
        text,
        sources: context.sources.slice(0, 5).map((s) => ({
          title: s.title,
          url: s.url,
          excerpt: s.content.substring(0, 150),
        })),
        processingTime: Date.now() - startTime,
      }
    } catch (error) {
      console.error('[GROQ] Error:', error)
      throw error
    }
  },

  async summarize(text: string, maxLength: number = 200): Promise<string> {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: Math.ceil(maxLength / 4),
        messages: [
          {
            role: 'user',
            content: `Summarize this in ~${maxLength} characters:\n\n${text}`,
          },
        ],
      })

      return message.content[0]?.type === 'text' ? message.content[0].text : ''
    } catch (error) {
      console.error('[LLM] Summarization failed:', error)
      return text.substring(0, maxLength)
    }
  },

  async extractKeywords(text: string): Promise<string[]> {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `Extract 5-10 key concepts from this text as a JSON array of strings:\n\n${text}`,
          },
        ],
      })

      const content = message.content[0]?.type === 'text' ? message.content[0].text : '[]'

      try {
        // Extract JSON from response
        const jsonMatch = content.match(/\[.*\]/s)
        const keywords = JSON.parse(jsonMatch?.[0] || '[]')
        return keywords
      } catch {
        return []
      }
    } catch (error) {
      console.error('[LLM] Keyword extraction failed:', error)
      return []
    }
  },
}
