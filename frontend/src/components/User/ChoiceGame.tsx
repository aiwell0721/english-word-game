import React, { useState, useEffect } from 'react'
import { useUser } from './UserProvider'
import type { Word } from '../types'
import './ChoiceGame.css'

interface ChoiceGameProps {
  level: number
  questionsCount?: number
}

interface Question {
  correct: Word
  options: Word[]
}

const ChoiceGame: React.FC<ChoiceGameProps> = ({ level, questionsCount = 5 }) => {
  const { user } = useUser()
  const [question, setQuestion] = useState<Question | null>(null)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completedCount, setCompletedCount] = useState(0)

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
        
        setQuestion({
          correct: correctWord,
          options: options
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
    const correct = optionIndex === 0 // 假设正确答案是第一个（实际需要更复杂的逻辑）
    
    setIsCorrect(correct)
    setShowFeedback(true)
    
    if (correct) {
      setScore(score + 10)
      setCompletedCount(completedCount + 1)
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
    <div className="choice-game-container">
      <header className="game-header">
        <div className="progress-info">
          <span className="question-num">问题 {questionIndex + 1}/{questionsCount}</span>
          <span className="score">得分: {score}</span>
        </div>
        <div className="level-badge">Level {level}</div>
      </header>

      <main className="game-main">
        <div className="question-card">
          <div className="word-display">
            <h2 className="word-text">{question.correct.word}</h2>
            <div className="word-info">
              <span className="phonetic">/{question.correct.phonetic}/</span>
              <span className="category">{question.correct.category}</span>
            </div>
          </div>
          
          <div className="question-text">
            <h3>这个单词的意思是？</h3>
          </div>
        </div>

        <div className="options-grid">
          {question.options.map((option, index) => (
            <button
              key={index}
              className={`option-card ${selectedOption === index ? 'selected' : ''} ${showFeedback && index === 0 ? (isCorrect ? 'correct' : 'wrong') : ''}`}
              onClick={() => !showFeedback && checkAnswer(index)}
              disabled={showFeedback}
            >
              <span className="option-word">{option.word}</span>
              <span className="option-meaning">{option.meaning}</span>
            </button>
          ))}
        </div>

        {showFeedback && (
          <div className="feedback-message">
            {isCorrect ? (
              <div className="correct-feedback">
                <span className="feedback-icon">✅</span>
                <span className="feedback-text">正确！</span>
                <span className="correct-meaning">{question.correct.meaning}</span>
              </div>
            ) : (
              <div className="wrong-feedback">
                <span className="feedback-icon">❌</span>
                <span className="feedback-text">不正确</span>
                <span className="correct-meaning">正确答案是: {question.correct.meaning}</span>
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
          <button
            className="action-btn back"
            onClick={() => setQuestionIndex(Math.max(0, questionIndex - 1))}
            disabled={questionIndex === 0}
          >
            ← 上一题
          </button>
        </div>
      </main>
    </div>
  )
}

export default ChoiceGame
