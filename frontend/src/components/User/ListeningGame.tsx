import React, { useState, useEffect } from 'react'
import { useUser } from './UserProvider'
import type { Word } from '../types'
import './ListeningGame.css'

interface ListeningGameProps {
  level: number
  wordsCount?: number
}

const ListeningGame: React.FC<ListeningGameProps> = ({ level, wordsCount = 5 }) => {
  const { user } = useUser()
  const [word, setWord] = useState<Word | null>(null)
  const [options, setOptions] = useState<string[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // 获取随机词汇和生成选项
  const fetchWordAndOptions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/words/random?level=${level}`)
      const data = await response.json()
      
      if (data.success) {
        const correctWord = data.data as Word
        
        // 生成错误选项（同音或相似拼写）
        const wrongOptions = [
          correctWord.word.slice(0, -1) + 't', // 最后一个字母改为't'
          't' + correctWord.word.slice(1), // 开头加't'
          correctWord.word.replace(/[aeiou]/g, 'o') // 替换元音
        ]
        
        const allOptions = [correctWord.word, ...wrongOptions]
          .sort(() => Math.random() - 0.5)
          .slice(0, 4)
        
        setWord(correctWord)
        setOptions(allOptions)
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
      fetchWordAndOptions()
    }
  }, [user, level])

  // 播放单词发音
  const playPronunciation = () => {
    if (!word) return
    
    // 使用Web Speech API播放发音
    const utterance = new SpeechSynthesisUtterance(word.phonetic || word.word, 'en-US')
    window.speechSynthesis.speak(utterance)
    setIsPlaying(true)
    
    utterance.onend = () => {
      setIsPlaying(false)
    }
  }

  // 检查答案
  const checkAnswer = (selectedWord: string) => {
    if (!word) return
    
    const correct = selectedWord === word.word
    setIsCorrect(correct)
    
    if (correct) {
      setScore(score + 10)
      setCompletedCount(completedCount + 1)
      setTimeout(() => {
        fetchWordAndOptions()
      }, 1500)
    }
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  if (!word) {
    return <div className="no-word">暂无词汇</div>
  }

  return (
    <div className="listening-game-container">
      <header className="game-header">
        <div className="score-info">
          <span className="score">得分: {score}</span>
          <span className="completed">已完成: {completedCount}</span>
        </div>
        <div className="level-badge">Level {level}</div>
      </header>

      <main className="game-main">
        <div className="word-section">
          <div className="play-button" onClick={playPronunciation}>
            <span className="icon">{isPlaying ? '🔊' : '🔇'}</span>
            <span className="text">播放发音</span>
          </div>
          
          <div className="word-display">
            <h2 className="word-text">听音拼写单词</h2>
          </div>
        </div>

        <div className="options-section">
          <h3 className="options-title">选择正确的拼写：</h3>
          <div className="options-grid">
            {options.map((option, index) => (
              <button
                key={index}
                className={`option-card ${isCorrect !== null && option === word.word ? (isCorrect ? 'correct' : 'wrong') : ''}`}
                onClick={() => {
                  if (isCorrect === null) {
                    checkAnswer(option)
                  }
                }}
                disabled={isCorrect !== null}
              >
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        </div>

        {isCorrect !== null && (
          <div className={`feedback-message ${isCorrect ? 'correct' : 'wrong'}`}>
            {isCorrect ? '✅ 正确！' : '❌ 再试一次'}
          </div>
        )}

        <div className="actions">
          <button
            className="action-btn skip"
            onClick={fetchWordAndOptions}
            disabled={isCorrect !== null}
          >
            ⏭ 跳过
          </button>
        </div>
      </main>
    </div>
  )
}

export default ListeningGame
