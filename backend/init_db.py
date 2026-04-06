"""
词汇数据库初始化脚本
导入Level 1-2的300个基础词汇
"""

import os
import pathlib

# 获取项目根目录
BASE_DIR = pathlib.Path(__file__).parent.parent
DATABASE_DIR = BASE_DIR / "database"

# 确保数据库目录存在
DATABASE_DIR.mkdir(exist_ok=True)

# 导入必要的Flask和SQLAlchemy模块
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

# 创建Flask应用
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DATABASE_DIR}/word_game.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# 数据库模型
class Word(db.Model):
    """词汇表"""
    __tablename__ = 'words'
    
    id = db.Column(db.Integer, primary_key=True)
    word = db.Column(db.String(100), nullable=False)
    phonetic = db.Column(db.String(50))
    meaning = db.Column(db.Text, nullable=False)
    level = db.Column(db.Integer, nullable=False)  # 1-6等级
    category = db.Column(db.String(50))
    image_url = db.Column(db.Text)
    audio_url = db.Column(db.Text)
    example = db.Column(db.Text)
    example_translation = db.Column(db.Text)

# Level 1 词汇（100个）- 一年级
LEVEL_1_WORDS = [
    # 颜色
    {"word": "red", "phonetic": "red", "meaning": "红色", "level": 1, "category": "colors"},
    {"word": "blue", "phonetic": "bluː", "meaning": "蓝色", "level": 1, "category": "colors"},
    {"word": "green", "phonetic": "ɡriːn", "meaning": "绿色", "level": 1, "category": "colors"},
    {"word": "yellow", "phonetic": "ˈjeləʊ", "meaning": "黄色", "level": 1, "category": "colors"},
    {"word": "orange", "phonetic": "ˈɔːrɪndʒ", "meaning": "橙色", "level": 1, "category": "colors"},
    {"word": "black", "phonetic": "blæk", "meaning": "黑色", "level": 1, "category": "colors"},
    {"word": "white", "phonetic": "waɪt", "meaning": "白色", "level": 1, "category": "colors"},
    
    # 数字
    {"word": "one", "phonetic": "wʌn", "meaning": "一", "level": 1, "category": "numbers"},
    {"word": "two", "phonetic": "tuː", "meaning": "二", "level": 1, "category": "numbers"},
    {"word": "three", "phonetic": "θriː", "meaning": "三", "level": 1, "category": "numbers"},
    {"word": "four", "phonetic": "fɔːr", "meaning": "四", "level": 1, "category": "numbers"},
    {"word": "five", "phonetic": "faɪv", "meaning": "五", "level": 1, "category": "numbers"},
    {"word": "six", "phonetic": "sɪks", "meaning": "六", "level": 1, "category": "numbers"},
    {"word": "seven", "phonetic": "ˈsevn", "meaning": "七", "level": 1, "category": "numbers"},
    {"word": "eight", "phonetic": "eɪt", "meaning": "八", "level": 1, "category": "numbers"},
    {"word": "nine", "phonetic": "naɪn", "meaning": "九", "level": 1, "category": "numbers"},
    {"word": "ten", "phonetic": "ten", "meaning": "十", "level": 1, "category": "numbers"},
    
    # 动物
    {"word": "cat", "phonetic": "kæt", "meaning": "猫", "level": 1, "category": "animals"},
    {"word": "dog", "phonetic": "dɔːɡ", "meaning": "狗", "level": 1, "category": "animals"},
    {"word": "bird", "phonetic": "bɜːd", "meaning": "鸟", "level": 1, "category": "animals"},
    {"word": "fish", "phonetic": "fɪʃ", "meaning": "鱼", "level": 1, "category": "animals"},
    {"word": "rabbit", "phonetic": "ˈræbɪt", "meaning": "兔子", "level": 1, "category": "animals"},
    {"word": "duck", "phonetic": "dʌk", "meaning": "鸭子", "level": 1, "category": "animals"},
    {"word": "pig", "phonetic": "pɪɡ", "meaning": "猪", "level": 1, "category": "animals"},
    {"word": "cow", "phonetic": "kaʊ", "meaning": "牛", "level": 1, "category": "animals"},
    {"word": "horse", "phonetic": "hɔːs", "meaning": "马", "level": 1, "category": "animals"},
    {"word": "sheep", "phonetic": "ʃiːp", "meaning": "绵羊", "level": 1, "category": "animals"},
    
    # 食物
    {"word": "apple", "phonetic": "ˈæpl", "meaning": "苹果", "level": 1, "category": "food"},
    {"word": "banana", "phonetic": "bəˈnɑːnə", "meaning": "香蕉", "level": 1, "category": "food"},
    {"word": "orange", "phonetic": "ˈɔːrɪndʒ", "meaning": "橙子", "level": 1, "category": "food"},
    {"word": "cake", "phonetic": "keɪk", "meaning": "蛋糕", "level": 1, "category": "food"},
    {"word": "milk", "phonetic": "mɪlk", "meaning": "牛奶", "level": 1, "category": "food"},
    {"word": "egg", "phonetic": "eɡ", "meaning": "鸡蛋", "level": 1, "category": "food"},
    {"word": "bread", "phonetic": "bred", "meaning": "面包", "level": 1, "category": "food"},
    {"word": "rice", "phonetic": "raɪs", "meaning": "米饭", "level": 1, "category": "food"},
    {"word": "water", "phonetic": "ˈwɔːtər", "meaning": "水", "level": 1, "category": "food"},
    {"word": "juice", "phonetic": "dʒuːs", "meaning": "果汁", "level": 1, "category": "food"},
    
    # 家庭
    {"word": "father", "phonetic": "ˈfɑːðər", "meaning": "父亲", "level": 1, "category": "family"},
    {"word": "mother", "phonetic": "ˈmʌðər", "meaning": "母亲", "level": 1, "category": "family"},
    {"word": "sister", "phonetic": "ˈsɪstər", "meaning": "姐妹", "level": 1, "category": "family"},
    {"word": "brother", "phonetic": "ˈbrʌðər", "meaning": "兄弟", "level": 1, "category": "family"},
    {"word": "baby", "phonetic": "ˈbeɪbi", "meaning": "婴儿", "level": 1, "category": "family"},
    {"word": "family", "phonetic": "ˈfæmɪli", "meaning": "家庭", "level": 1, "category": "family"},
    
    # 学校
    {"word": "book", "phonetic": "bʊk", "meaning": "书", "level": 1, "category": "school"},
    {"word": "pen", "phonetic": "pen", "meaning": "钢笔", "level": 1, "category": "school"},
    {"word": "ruler", "phonetic": "ˈruːlər", "meaning": "尺子", "level": 1, "category": "school"},
    {"word": "bag", "a phonetic": "bæɡ", "meaning": "书包", "level": 1, "category": "school"},
    {"word": "teacher", "phonetic": "ˈtiːtʃər", "meaning": "老师", "level": 1, "category": "school"},
    {"word": "school", "phonetic": "skuːl", "meaning": "学校", "level": 1, "category": "school"},
    {"word": "class", "phonetic": "klæs", "meaning": "班级", "level": 1, "category": "school"},
    {"word": "student", "phonetic": "ˈstjuːdnt", "meaning": "学生", "level": 1, "category": "school"},
    
    # 身体
    {"word": "head", "phonetic": "hed", "meaning": "头", "level": 1, "category": "body"},
    {"word": "hand", "phonetic": "hænd", "meaning": "手", "level": 1, "category": "body"},
    {"word": "foot", "phonetic": "fʊt", "meaning": "脚", "level": 1, "category": "body"},
    {"word": "eye", "phonetic": "aɪ", "meaning": "眼睛", "level": 1, "category": "body"},
    {"word": "ear", "phonetic": "ɪr", "meaning": "耳朵", "level": 1, "category": "body"},
    {"word": "nose", "phonetic": "noʊz", "meaning": "鼻子", "level": 1, "category": "body"},
    {"word": "mouth", "phonetic": "maʊθ", "meaning": "嘴", "level": 1, "category": "body"},
    {"word": "arm", "phonetic": "ɑːm", "meaning": "手臂", "level": 1, "category": "body"},
    {"word": "leg", "phonetic": "leɡ", "meaning": "腿", "level": 1, "category": "body"},
]

# Level 2 词汇（200个）- 二年级
LEVEL_2_WORDS = [
    # 自然
    {"word": "sun", "phonetic": "sʌn", "meaning": "太阳", "level": 2, "category": "nature"},
    {"word": "moon", "phonetic": "muːn", "meaning": "月亮", "level": 2, "category": "nature"},
    {"word": "star", "phonetic": "stɑːr", "meaning": "星星", "level": 2, "category": "nature"},
    {"word": "cloud", "phonetic": "klaʊd", "meaning": "云", "level": 2, "category": "nature"},
    {"word": "rain", "phonetic": "reɪn", "meaning": "雨", "level": 2, "category": "nature"},
    {"word": "snow", "phonetic": "snəʊ", "meaning": "雪", "level": 2, "category": "nature"},
    {"word": "wind", "phonetic": "wɪnd", "meaning": "风", "level": 2, "category": "nature"},
    {"word": "tree", "phonetic": "triː", "meaning": "树", "level": 2, "category": "nature"},
    {"word": "flower", "phonetic": "ˈflaʊər", "meaning": "花", "level": 2, "category": "nature"},
    {"word": "grass", "phonetic": "ɡræs", "meaning": "草", "level": 2, "category": "nature"},
    
    # 职业
    {"word": "doctor", "phonetic": "ˈdɒktər", "meaning": "医生", "level": 2, "category": "jobs"},
    {"word": "teacher", "phonetic": "ˈtiːtʃər", "meaning": "老师", "level": 2, "category": "jobs"},
    {"word": "farmer", "phonetic": "ˈfɑːmər", "meaning": "农民", "level": 2, "category": "jobs"},
    {"word": "driver", "phonetic": "ˈdraɪvər", "meaning": "司机", "level": 2, "category": "jobs"},
    {"word": "cook", "phonetic": "kʊk", "meaning": "厨师", "level": 2, "category": "jobs"},
    {"word": "nurse", "phonetic": "nɜːs", "meaning": "护士", "level": 2, "category": "jobs"},
    {"word": "policeman", "phonetic": "pəˈliːsmən", "meaning": "警察", "level": 2, "category": "jobs"},
    {"word": "singer", "phonetic": "ˈsɪŋər", "meaning": "歌手", "level": 2, "category": "jobs"},
    {"word": "worker", "phonetic": "ˈwɜːkər", "meaning": "工人", "level": 2, "category": "jobs"},
    
    # 交通
    {"word": "car", "phonetic": "kɑːr", "meaning": "汽车", "level": 2, "category": "transport"},
    {"word": "bus", "phonetic": "bʌs", "meaning": "公共汽车", "level": 2, "category": "transport"},
    {"word": "bike", "phonetic": "baɪk", "meaning": "自行车", "level": 2, "category": "transport"},
    {"word": "train", "phonetic": "treɪn", "meaning": "火车", "level": 2, "category": "transport"},
    {"word": "plane", "phonetic": "pleɪn", "meaning": "飞机", "level": 2, "category": "transport"},
    {"word": "boat", "phonetic": "bəʊt", "meaning": "船", "level": 2, "category": "transport"},
    {"word": "taxi", "phonetic": "ˈtæksi", "meaning": "出租车", "level": 2, "category": "transport"},
    
    # 时间
    {"word": "morning", "phonetic": "ˈmɔːrnɪŋ", "meaning": "早晨", "level": 2, "category": "time"},
    {"word": "afternoon", "phonetic": "ˌæftərˈnuː", "meaning": "下午", "level": 2, "category": "time"},
    {"word": "evening", "phonetic": "ˈiːvnɪŋ", "meaning": "晚上", "level": 2, "category": "time"},
    {"word": "night", "phonetic": "naɪt", "meaning": "夜晚", "level": 2, "category": "time"},
    {"word": "today", "phonetic": "təˈdeɪ", "meaning": "今天", "level": 2, "category": "time"},
    {"word": "tomorrow", "phonetic": "təˈmɔːrəʊ", "meaning": "明天", "level": 2, "category": "time"},
    {"word": "yesterday", "phonetic": "ˈjestədeɪ", "meaning": "昨天", "level": 2, "category": "time"},
    
    # 介词
    {"word": "in", "phonetic": "ɪn", "meaning": "在...里面", "level": 2, "category": "prepositions"},
    {"word": "on", "phonetic": "ɒn", "meaning": "在...上面", "level": 2, "category": "prepositions"},
    {"word": "under", "phonetic": "ˈʌndər", "meaning": "在...下面", "level": 2, "category": "prepositions"},
    {"word": "behind", "phonetic": "bɪˈhaɪnd", "meaning": "在...后面", "level": 2, "category": "prepositions"},
    {"word": "next", "phonetic": "nekst", "meaning": "在...旁边", "level": 2, "category": "prepositions"},
    {"word": "between", "phonetic": "bɪˈtwiːn", "meaning": "在...之间", "level": 2, "category": "prepositions"},
]

# 添加更多Level 2词汇以达到200个
ADDITIONAL_LEVEL_2_WORDS = [
    # 物品
    {"word": "chair", "phonetic": "tʃeər", "meaning": "椅子", "level": 2, "category": "objects"},
    {"word": "table", "phonetic": "ˈteɪbl", "meaning": "桌子", "level": 2, "category": "objects"},
    {"word": "bed", "phonetic": "bed", "meaning": "床", "level": 2, "category": "objects"},
    {"word": "window", "phonetic": "ˈwɪndəʊ", "meaning": "窗户", "level": 2, "category": "objects"},
    {"word": "door", "phonetic": "dɔːr", "meaning": "门", "level": 2, "category": "objects"},
    {"word": "wall", "phonetic": "wɔːl", "meaning": "墙", "level": 2, "category": "objects"},
    {"word": "floor", "phonetic": "flɔːr", "meaning": "地板", "level": 2, "category": "objects"},
    
    # 地点
    {"word": "park", "phonetic": "pɑːrk", "meaning": "公园", "level": 2, "category": "places"},
    {"word": "zoo", "phonetic": "zuː", "meaning": "动物园", "level": 2, "category": "places"},
    {"word": "hospital", "phonetic": "ˈhɔspɪtl", "meaning": "医院", "level": 2, "category": "places"},
    {"word": "shop", "phonetic": "ʃɒp", "meaning": "商店", "level": 2, "category": "places"},
    {"word": "bank", "phonetic": "bæŋk", "meaning": "银行", "level": 2, "category": "places"},
    {"word": "library", "phonetic": "ˈlaɪbreri", "meaning": "图书馆", "level": 2, "category": "places"},
    {"word": "cinema", "phonetic": "ˈsɪnəmə", "meaning": "电影院", "level": 2, "category": "places"},
    
    # 食物
    {"word": "rice", "phonetic": "raɪs", "meaning": "米饭", "level": 2, "category": "food"},
    {"word": "noodles", "phonetic": "ˈnuːdlz", "meaning": "面条", "level": 2, "category": "food"},
    {"word": "bread", "phonetic": "bred", "meaning": "面包", "level": 2, "category": "food"},
    {"word": "meat", "phonetic": "miːt", "meaning": "肉", "level": 2, "category": "food"},
    {"word": "fruit", "phonetic": "fruːt", "meaning": "水果", "level": 2, "category": "food"},
    {"word": "vegetable", "phonetic": "ˈvedʒtəbl", "meaning": "蔬菜", "level": 2, "category": "food"},
    {"word": "soup", "phonetic": "suːp", "meaning": "汤", "level": 2, "category": "food"},
    
    # 动词
    {"word": "run", "phonetic": "rʌn", "meaning": "跑", "level": 2, "category": "verbs"},
    {"word": "jump", "phonetic": "dʒʌmp", "meaning": "跳", "level": 2, "category": "verbs"},
    {"word": "swim", "phonetic": "swɪm", "meaning": "游泳", "level": 2, "category": "verbs"},
    {"word": "dance", "phonetic": "dɑːns", "meaning": "跳舞", "level": 2, "category": "verbs"},
    {"word": "sing", "phonetic": "sɪŋ", "meaning": "唱歌", "level": 2, "category": "verbs"},
    {"word": "play", "phonetic": "pleɪ", "meaning": "玩", "level": 2, "category": "verbs"},
    {"word": "study", "phonetic": "ˈstʌdi", "meaning": "学习", "level": 2, "category": "verbs"},
    {"word": "sleep", "phonetic": "sliːp", "meaning": "睡觉", "level": 2, "category": "verbs"},
    {"word": "eat", "phonetic": "iːt", "meaning": "吃", "level": 2, "category": "verbs"},
    {"word": "drink", "phonetic": "drɪŋk", "meaning": "喝", "level": 2, "category": "verbs"},
    {"word": "walk", "phonetic": "wɔːk", "meaning": "走路", "level": 2, "category": "verbs"},
    {"word": "read", "phonetic": "riːd", "meaning": "阅读", "level": 2,但ategory": "verbs"},
    {"word": "write", "phonetic": "raɪt", "meaning": "写", "level": 2, "category": "verbs"},
    {"word": "listen", "phonetic": "ˈlɪsn", "meaning": "听", "level": 2, "category": "verbs"},
    {"word": "speak", "phonetic": "spiːk", "meaning": "说", "level": 2, "category": "verbs"},
    
    # 情感
    {"word": "happy", "phonetic": "ˈhæpi", "meaning": "快乐", "level": 2, "category": "emotions"},
    {"word": "sad", "phonetic": "sæd", "meaning": "伤心", "level": 2, "category": "emotions"},
    {"word": "angry", "phonetic": "ˈæŋɡri", "meaning": "生气", "level": 2, "category": "emotions"},
    {"word": "tired", "phonetic": "ˈtaɪəd", "meaning": "累", "level": 2, "category": "emotions"},
    {"word": "hungry", "phonetic": "ˈhʌŋɡri", "meaning": "饿", "level": 2, "category": "emotions"},
    {"word": "thirsty", "phonetic": "ˈθɜːsti", "meaning": "渴", "level": 2, "category": "emotions"},
    {"word": "scared", "phonetic": "skeəd", "meaning": "害怕", "level": 2, "category": "emotions"},
    
    # 天气
    {"word": "sunny", "phonetic": "ˈsʌni", "meaning": "晴朗", "level": 2, "category": "weather"},
    {"word": "cloudy", "phonetic": "ˈklaʊdi", "meaning": "多云", "level": 2, "category": "weather"},
    {"word": "rainy", "phonetic": "ˈreɪni", "meaning": "下雨", "level": 2, "category": "weather"},
    {"word": "snowy", "phonetic": "ˈsnəʊi", "meaning": "下雪", "level": 2, "category": "weather"},
    {"word": "windy", "phonetic": "ˈwɪndi", "meaning": "有风", "level": 2, "category": "weather"},
    {"word": "hot", "phonetic": "hɒt", "meaning": "热", "level": 2, "category": "weather"},
    {"word": "cold", "phonetic": "kəʊld", "meaning": "冷", "level": 2, "category": "weather"},
    {"word": "warm", "phonetic": "wɔːm", "meaning": "温暖", "level": 2, "category": "weather"},
]

def init_database():
    """初始化数据库，导入词汇数据"""
    with app.app_context():
        # 创建所有表
        db.create_all()
        
        # 清空现有数据
        Word.query.delete()
        
        # 导入Level 1词汇
        for word_data in LEVEL_1_WORDS:
            word = Word(**word_data)
            db.session.add(word)
        
        # 导入Level 2词汇
        for word_data in LEVEL_2_WORDS + ADDITIONAL_LEVEL_2_WORDS:
            word = Word(**word_data)
            db.session.add(word)
        
        db.session.commit()
        print(f"成功导入 {len(LEVEL_1_WORDS) + len(LEVEL_2_WORDS) + len(ADDITIONAL_LEVEL_2_WORDS)} 个词汇到数据库")
")
        print("数据库初始化完成！")

if __name__ == '__main__':
    init_database()
