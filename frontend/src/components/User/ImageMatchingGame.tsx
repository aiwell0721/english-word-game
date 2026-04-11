import React, { useState, useEffect } from 'react'
import { useUser } from './UserProvider'
import type { Word } from '../types'
import './ImageMatchingGame.css'

interface ImageMatchingGameProps {
  level: number
  wordsCount?: number
}

interface Question {
  word: Word
  options: Word[]
  imagePlaceholder: string
}

// emoji映射表（用于模拟图片）
const emojiMap: { [key: string]: string } = {
  'colors': '🎨',
  'animals': '🐾',
  'food': '🍎',
  'family': '👨',
  'school': '🏫',
  'body': '👤',
  'nature': '🌲',
  'jobs': '👨',
  'transport': '🚗',
  'time': '⏰',
  'prepositions': '📍',
  'objects': '📦',
  'places': '🏠',
  'verbs': '⚡',
  'emotions': '😊',
  'weather': '🌤',
  'actions': '💪',
  'adjectives': '🏷',
  'safety': '⚠️',
  'society': '🏛',
  'values': '💎',
  'security': '🔒'
}

const ImageMatchingGame: React.FC<ImageMatchingGameProps> = ({ level, wordsCount = 5 }) => {
  const { user } = useUser()
  const [question, setQuestion] = useState<Question | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [completedQuestion, setCompletedQuestion] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [loading, setLoading] = useState(true)

  // 生成选项
  const generateOptions = (correctWord: Word, allWords: Word[], count = 4): Word[] => {
    const options: Word[] = [correctWord]
    const otherWords = allWords.filter(w => w.id !== correctWord.id)
    
    // 随机打乱数组
    for (let i = otherWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[otherWords[i], otherWords[j]] = [otherWords[j], otherWords[i]]
    }
    
    // 添加错误选项
    for (let i = 0; i < count - 1; i++) {
      if (i < otherWords.length) {
        options.push(otherWords[i])
      }
    }
    
    // 打乱选项
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[options[i], options[j]] = [options[j], options[i]]
    }
    
    return options
  }

  // 获取随机问题
  const fetchQuestion = async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/words/random?level=${level}`)
      const data = await response.json()
      
      if (data.success) {
        const correctWord = data.data as Word
        
        // 获取所有单词用于生成错误选项
        const allWordsResponse = await fetch(`http://localhost:5000/api/words?level=${level}&limit=20`)
        const allWordsData = await allWordsResponse.json()
        const allWords: Word[] = (allWordsData.data || []).filter((w: any) => w.id !== correctWord.id)
        
        // 生成选项
        const options = generateOptions(correctWord, allWords, 4)
        
        // 获取对应的emoji作为图片占位符
        const emoji = emojiMap[correctWord.category] || '📷'
        
        setQuestion({
          word: correctWord,
          options: options,
          imagePlaceholder: emoji
        })
        setSelectedOption(null)
        setShowFeedback(false)
      }
    } catch (error) {
      console.error('获取问题失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchQuestion()
    }
  }, [user, level])

  // 检查答案
  const checkAnswer = (optionIndex: number) => {
    setSelectedOption(optionIndex)
    const correct = question!.options[optionIndex].id === question!.word.id
    
    setIsCorrect(correct)
    setShowFeedback(true)
    
    if (correct) {
      setScore(score + 10)
      setCompletedQuestion(completedQuestion + 1)
    }
    
    // 延迟显示下一题
    setTimeout(() => {
      fetchQuestion()
    }, 2000)
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  if (!question) {
    return <div className="no-question">暂无问题</div>
  }

  return (
    <div className="image-matching-game-container">
      <header className="game-header">
        <div className="score-info">
          <span className="score">得分: {score}</span>
          <span className="completed">已完成: {completedQuestion}/{wordsCount}</span>
        </div>
        <div className="level-badge">Level {level}</div>
      </header>

      <main className="game-main">
        <div className="image-section">
          <div className="image-display">
            <div className="placeholder-image">
              <span className="emoji">{question.imagePlaceholder}</span>
              <span className="category-badge">{question.word.category}</span>
            </div>
          </div>
          
          <div className="question-prompt">
            <h3>这个图片对应的单词是？</h3>
            <p className="hint">提示: {question.word.meaning}</p>
          </div>
        </div>

        <div className="options-section">
          <div className="options-grid">
            {question.options.map((option, index) => (
              <button
                key={index}
                className={`option-card ${selectedOption === index ? 'selected' : ''} ${showFeedback && option.id === question.word.id ? (isCorrect ? 'correct' : 'wrong') : ''}`}
                onClick={() => !showFeedback && checkAnswer(index)}
                disabled={showFeedback}
              >
                <span className="option-word">{option.word}</span>
                <span className="option-phonetic">/{option.phonetic}/</span>
              </button>
            ))}
          </div>
        </div>

        {showFeedback && (
          <div className="feedback-message">
            {isCorrect ? (
              <div className="correct-feedback">
                <span className="feedback-icon">✅</span>
                <span className="feedback-text">正确！</span>
                <span className="correct-word">{question.word.word}</span>
              </div>
            ) : (
              <div className="wrong-feedback">
                <span className="feedback-icon">❌</span>
                <span className="feedback-text">不正确</span>
                <span className="correct-word">正确答案是: {question.word.word}</span>
              </div>
            )}
          </div>
        )}

        <div className="actions">
          <button
            className="action-btn skip"
            onClick={fetchQuestion}
            disabled={showFeedback}
          >
            ⏭ 跳过
          </button>
        </div>
      </main>
    </div>
  )
}

export default ImageMatchingGame
