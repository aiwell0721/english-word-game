import React, { useState, useEffect } from 'react'
import { useUser } from './UserProvider'
import type { Word } from '../types'
import './SpellingGame.css'

interface SpellingGameProps {
  level: number
  wordsCount?: number
}

const SpellingGame: React.FC<SpellingGameProps> = ({ level, wordsCount = 5 }) => {
  const { user } = useUser()
  const [word, setWord] = useState<Word | null>(null)
  const [userInput, setUserInput] = useState('')
  const [score, setScore] = useState(0)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [completedCount, setCompletedCount] = useState(0)

  // 获取随机词汇
  const fetchRandomWord = async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/words/random?level=${level}`)
      const data = await response.json()
      if (data.success) {
        setWord(data.data)
        setUserInput('')
        setIsCorrect(null)
      }
    } catch (error) {
      console.error('获取词汇失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchRandomWord()
    }
  }, [user, level])

  // 检查拼写
  const checkSpelling = () => {
    if (!word) return
    
    const correct = userInput.toLowerCase().trim() === word.word.toLowerCase()
    setIsCorrect(correct)
    
    if (correct) {
      setScore(score + 10)
      setCompletedCount(completedCount + 1)
      // 延迟显示下一个词
      setTimeout(() => {
        fetchRandomWord()
      }, 1500)
    }
  }

  // 显示提示
  const showHint = () => {
    if (!word) return
    const hint = word.word.substring(0, 2)
    setUserInput(hint)
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  if (!word) {
    return <div className="no-word">暂无词汇</div>
  }

  return (
    <div className="spelling-game-container">
      <header className="game-header">
        <div className="score-info">
          <span className="score">得分: {score}</span>
          <span className="completed">已完成: {completedCount}</span>
        </div>
        <div className="level-badge">Level {level}</div>
      </header>

      <main className="game-main">
        <div className="word-display">
          <div className="word-meaning">{word.meaning}</div>
          <div className="word-phonetic">/{word.phonetic}/</div>
          <div className="word-category">{word.category}</div>
        </div>

        <div className="input-section">
          <input
            type="text"
            className="word-input"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                checkSpelling()
              }
            }}
            placeholder="请输入单词拼写..."
            disabled={isCorrect !== null}
          />
          
          <div className="feedback-message">
            {isCorrect === true && <span className="correct">✅ 正确！</span>}
            {isCorrect === false && <span className="wrong">❌ 再试一次</span>}
          </div>
        </div>

        <div className="actions">
          <button className="action-btn check" onClick={checkSpelling} disabled={isCorrect !== null}>
            检查
          </button>
          <button className="action-btn hint" onClick={showHint} disabled={isCorrect !== null}>
            💡 提示
          </button>
          <button className="action-btn skip" onClick={fetchRandomWord}>
            ⏭ 跳过
          </button>
        </div>
      </main>
    </div>
  )
}

export default SpellingGame
