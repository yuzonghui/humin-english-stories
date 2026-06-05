const fs = require('fs');
const path = require('path');

const themes = [
  'The Wise Old Tree', 'A Letter from Home', 'The Little Café', 'Rain on Monday',
  'The Lost Key', 'Morning Run', 'A Gift for Mom', 'The Quiet Library',
  'Crossing the Bridge', 'Stars at Night', 'The Red Bicycle', 'Fresh Bread',
  'An Honest Mistake', 'The New Neighbor', 'Waiting for the Bus', 'A Small Garden',
  'The Old Photograph', 'Learning to Swim', 'The Broken Watch', 'City Lights',
  'A Walk in the Park', 'The Music Box', 'Grandma\'s Recipe', 'The Empty Room',
  'First Day at Work', 'The Blue Notebook', 'Snow in April', 'The Open Window',
  'Two Friends', 'The Long Road', 'A Cup of Tea', 'The Golden Ring',
  'Late for Class', 'The Wooden Boat', 'Summer Memories', 'The Green Hill',
  'A Strange Dream', 'The Clock Tower', 'Paper Planes', 'The Old Map',
  'Meeting Again', 'The Silent Phone', 'Fresh Start', 'The Mirror',
  'Under the Oak', 'The Last Train', 'A Simple Choice', 'The Painted Door',
  'Wind and Waves', 'The Hidden Path', 'Bright Eyes', 'The Stone Bench',
  'Letters Unsent', 'The Warm Coat', 'Night Market', 'The Silver Coin',
  'Growing Up', 'The Tall Building', 'River Song', 'The Empty Bench',
  'A New Habit', 'The Faded Flag', 'Morning Coffee', 'The Narrow Street',
  'Shared Secrets', 'The White Cat', 'Autumn Leaves', 'The Big Decision',
  'Quiet Courage', 'The Old Song', 'Sunset Beach', 'The Locked Gate',
  'Unexpected Help', 'The Tiny Seed', 'Winter Fire', 'The Long Letter',
  'True Friendship', 'The Open Road', 'Peaceful Mind', 'The Final Lesson', 'A New Dawn'
];

const cnTitles = [
  '智慧老树', '家书', '小咖啡馆', '周一的雨', '丢失的钥匙', '晨跑', '给妈妈的礼物',
  '安静的图书馆', '过桥', '夜星', '红色自行车', '新鲜面包', '诚实的错误', '新邻居',
  '等公交', '小花园', '旧照片', '学游泳', '坏掉的手表', '城市灯光', '公园散步',
  '音乐盒', '奶奶的食谱', '空房间', '上班第一天', '蓝色笔记本', '四月飞雪',
  '打开的窗', '两个朋友', '漫长的路', '一杯茶', '金戒指', '上课迟到', '木船',
  '夏日回忆', '青山', '奇怪的梦', '钟楼', '纸飞机', '旧地图', '再次相遇',
  '沉默的电话', '新开始', '镜子', '橡树下', '末班车', '简单的选择', '彩绘的门',
  '风与浪', '隐藏的小路', '明亮的眼睛', '石凳', '未寄出的信', '温暖的外套',
  '夜市', '银币', '成长', '高楼', '河之歌', '空长椅', '新习惯', '褪色的旗',
  '早晨咖啡', '窄街', '共享的秘密', '白猫', '秋叶', '重大决定', '安静的勇气',
  '老歌', '日落海滩', '锁住的门', '意外的帮助', '小种子', '冬日炉火',
  '长信', '真正的友谊', '开放的路', '平静的心', '最后一课', '新的黎明'
];

function makeStory(enTitle) {
  const topic = enTitle.toLowerCase().replace(/^the /, '');
  const paragraphs = [
    `Once upon a time, there was a small ${topic} in a quiet town. People passed by every day, but few stopped to look closely. One morning, a young student named Lily decided to stay and observe. She wrote down every detail in her notebook. The sun rose slowly over the hills, and the air felt fresh and calm.`,
    `Lily had an important exam next month. She wanted to improve her English, so she read stories aloud each night. Her teacher said practice makes perfect. Lily believed that small steps could lead to big changes. She listened carefully to every word and tried to remember new phrases.`,
    `Days turned into weeks, and Lily kept working hard. Sometimes she felt tired, but she never gave up. Her friends noticed her progress and asked for advice. Lily smiled and said, "Just start with one sentence a day." They laughed, yet they knew she was right.`,
    `One evening, Lily finished reading the whole story. She closed her book and looked out the window. The stars shone like diamonds in the dark sky. She felt proud of herself and ready for tomorrow. Success, she thought, begins with courage and patience.`
  ];
  return paragraphs.join(' ').replace(/\s+/g, ' ');
}

function makeStoryCn(cnTitle) {
  const paragraphs = [
    `从前，在一个安静的小镇上，有一个与「${cnTitle}」有关的故事。人们每天从这里经过，但很少有人停下脚步仔细观察。一天早上，一位名叫莉莉的年轻学生决定留下来观察。她把每一个细节都记在本子上。太阳缓缓升过山岗，空气清新而宁静。`,
    `莉莉下个月要参加一场重要的考试。她想提高英语水平，于是每晚大声朗读故事。她的老师说，熟能生巧。莉莉相信，小的积累也能带来大的改变。她仔细听每一个词，努力记住新的短语。`,
    `日子一天天过去，转眼几星期过去了，莉莉仍在刻苦学习。有时她也会感到疲惫，但从未放弃。同学们注意到了她的进步，纷纷向她请教。莉莉笑着说："每天先从一句开始就好。"大家听了都笑了，却也知道她说得对。`,
    `一天傍晚，莉莉读完了整个故事。她合上书，望向窗外。夜幕中，星星如钻石般闪烁。她为自己感到骄傲，也准备好了迎接明天。她心想，成功始于勇气与耐心。`
  ];
  return paragraphs.join(' ');
}

const stories = themes.map((titleEn, i) => ({
  id: i + 1,
  title: cnTitles[i] || `故事 ${i + 1}`,
  titleEn,
  content: makeStory(titleEn),
  contentCn: makeStoryCn(cnTitles[i] || `故事 ${i + 1}`)
}));

const out = path.join(__dirname, '..', 'data', 'stories.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(stories, null, 2), 'utf-8');
console.log(`Generated ${stories.length} stories -> ${out}`);
