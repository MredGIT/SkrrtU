const INAPPROPRIATE_WORDS = [
  'fuck', 'shit', 'bitch', 'ass', 'damn', 'hell',
  'sex', 'porn', 'nude', 'naked', 'dick', 'pussy',
  'nigger', 'nigga', 'fag', 'rape', 'kill', 'die'
]

const SPAM_PATTERNS = [
  /(.)\1{4,}/gi, // Repeated characters (aaaaa)
  /https?:\/\//gi, // URLs
  /\d{10,}/g, // Long numbers (phone numbers)
]

export function filterContent(text) {
  const lowercaseText = text.toLowerCase()
  
  // Check for inappropriate words
  const hasInappropriateContent = INAPPROPRIATE_WORDS.some(word => 
    lowercaseText.includes(word)
  )
  
  if (hasInappropriateContent) {
    return {
      isClean: false,
      reason: 'Contains inappropriate language'
    }
  }
  
  // Check for spam patterns
  const hasSpam = SPAM_PATTERNS.some(pattern => pattern.test(text))
  
  if (hasSpam) {
    return {
      isClean: false,
      reason: 'Contains spam or suspicious content'
    }
  }
  
  // Check minimum length
  if (text.trim().length < 10) {
    return {
      isClean: false,
      reason: 'Confession is too short (minimum 10 characters)'
    }
  }
  
  return {
    isClean: true,
    reason: null
  }
}

export function censorText(text) {
  let censored = text
  
  INAPPROPRIATE_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi')
    censored = censored.replace(regex, '*'.repeat(word.length))
  })
  
  return censored
}
