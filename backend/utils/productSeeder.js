const Product = require('../models/Product');

const sampleProducts = [
  { name: 'Standart Yıkama', description: 'Günlük giysi yıkama', serviceType: 'standard', price: 15, category: 'Genel', image: null },
  { name: 'Hızlı Yıkama', description: '24 saat içinde yıkama', serviceType: 'express', price: 25, category: 'Genel', image: null },
  { name: 'Kuru Temizlik', description: 'Hassas kumaşlar için', serviceType: 'dry_clean', price: 30, category: 'Kuru Temizleme', image: null },
  { name: 'Ütüleme', description: 'Profesyonel ütü', serviceType: 'standard', price: 10, category: 'Ütüleme', image: null },
  { name: 'Nevresim Yıkama', description: 'Nevresim ve çarşaflar', serviceType: 'standard', price: 40, category: 'Ev Tekstili', image: null },
  { name: 'Hırka / Kazak', description: 'Hassas yıkama', serviceType: 'dry_clean', price: 18, category: 'Giyim', image: null },
  { name: 'Pantolon', description: 'Her türlü pantolon yıkama', serviceType: 'standard', price: 12, category: 'Giyim', image: null },
  { name: 'Gömlek', description: 'Gömlek yıkama & ütü', serviceType: 'standard', price: 9, category: 'Giyim', image: null },
  { name: 'Mont', description: 'Büyük dış giyim', serviceType: 'dry_clean', price: 45, category: 'Dış Giyim', image: null },
  { name: 'Yorgan', description: 'Büyük tekstiller', serviceType: 'standard', price: 80, category: 'Ev Tekstili', image: null }
];

const seedIfEmpty = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('Ürün koleksiyonu boş - seed verileri ekleniyor...');
      await Product.insertMany(sampleProducts);
      console.log('Örnek ürünler eklendi.');
    } else {
      console.log('Ürün koleksiyonu dolu, seed atlanıyor.');
    }
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

module.exports = { seedIfEmpty };
