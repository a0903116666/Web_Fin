const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function seed() {
  const db = await open({ filename: path.resolve(__dirname, 'database.sqlite'), driver: sqlite3.Database });
  
  // Get user IDs
  const users = await db.all('SELECT id, username FROM Users WHERE username IN (?, ?, ?)', ['john_doe', 'jane_smith', 'campus_hero']);
  
  const userMap = {};
  users.forEach(u => userMap[u.username] = u.id);
  
  const john_id = userMap['john_doe'];
  const jane_id = userMap['jane_smith'];
  const hero_id = userMap['campus_hero'];

  if (!john_id || !jane_id || !hero_id) {
    console.error("Missing one or more users:", userMap);
    return;
  }

  const products = [
    {
      seller_id: john_id,
      title: 'iPad Pro 11吋 (2022) 含Apple Pencil',
      description: '做筆記非常方便，九成新，因畢業換筆電故售出。',
      image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=800',
      type: 'sell',
      price: 22000,
      deposit: 0,
      tags: ['電子產品', '筆記本', '平板']
    },
    {
      seller_id: jane_id,
      title: '多益 5次全真模擬試題 (全新)',
      description: '買來一直沒寫，後來直接去考了，內頁完全空白。',
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
      type: 'sell',
      price: 450,
      deposit: 0,
      tags: ['教科書', '英文', '考試']
    },
    {
      seller_id: hero_id,
      title: '電吉他 + 音箱 新手套組',
      description: '適合社團新手，琴弦剛換過，可直接上場。只租不賣。',
      image_url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=800',
      type: 'rent',
      price: 300, // per day/week
      deposit: 3000,
      tags: ['樂器', '社團', '吉他']
    },
    {
      seller_id: john_id,
      title: 'IKEA 組合式書架/層架',
      description: '可以拆解，面交好帶。木紋色，很新。',
      image_url: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&q=80&w=800',
      type: 'sell',
      price: 500,
      deposit: 0,
      tags: ['生活用品', '家具']
    },
    {
      seller_id: jane_id,
      title: '微積分 提綱挈領 (原文版)',
      description: '理工科必備，裡面有一些筆記，不介意再買。',
      image_url: 'https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?auto=format&fit=crop&q=80&w=800',
      type: 'sell',
      price: 350,
      deposit: 0,
      tags: ['教科書', '理工']
    },
    {
      seller_id: hero_id,
      title: 'Sony 無線降噪耳機 WH-1000XM4',
      description: '圖書館讀書必備的神器，戴上去聽不到別人在講話。',
      image_url: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800',
      type: 'sell',
      price: 5500,
      deposit: 0,
      tags: ['電子產品', '耳機']
    },
    {
      seller_id: john_id,
      title: 'Switch 遊戲片 - 薩爾達傳說 王國之淚',
      description: '已經破關了，想換點現金買別的遊戲。',
      image_url: 'https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&q=80&w=800',
      type: 'sell',
      price: 1100,
      deposit: 0,
      tags: ['遊戲', '二手', 'Switch']
    },
    {
      seller_id: jane_id,
      title: '化妝品收納盒 (透明壓克力)',
      description: '宿舍桌上收納很方便，因為買了更大的所以把這個售出。',
      image_url: 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?auto=format&fit=crop&q=80&w=800',
      type: 'sell',
      price: 150,
      deposit: 0,
      tags: ['生活用品', '收納']
    },
    {
      seller_id: hero_id,
      title: '單眼相機 Canon EOS 200D',
      description: '迎新或辦活動借用，附一顆KIT鏡。需抵押學生證或押金。',
      image_url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
      type: 'rent',
      price: 500, // per day
      deposit: 8000,
      tags: ['電子產品', '相機', '活動']
    }
  ];

  await db.run('BEGIN TRANSACTION');
  try {
    for (let p of products) {
      const result = await db.run(`
        INSERT INTO Products (seller_id, title, description, image_url, type, price, deposit, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'available')
      `, [p.seller_id, p.title, p.description, p.image_url, p.type, p.price, p.deposit]);
      
      const productId = result.lastID;
      
      for (let t of p.tags) {
        let tag = await db.get('SELECT id FROM Tags WHERE name = ?', [t]);
        if (!tag) {
          const tagResult = await db.run('INSERT INTO Tags (name) VALUES (?)', [t]);
          tag = { id: tagResult.lastID };
        }
        await db.run('INSERT INTO Product_Tags (product_id, tag_id) VALUES (?, ?)', [productId, tag.id]);
      }
    }
    await db.run('COMMIT');
    console.log('Successfully seeded more products!');
  } catch (err) {
    await db.run('ROLLBACK');
    console.error('Error seeding products:', err);
  }
}

seed().catch(console.error);
