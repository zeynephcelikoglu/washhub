// Backend'e şu komutu çalıştırın: node scripts/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

const seedDatabase = async () => {
  try {
    // Support both env names
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('MongoDB bağlantı başarılı');

    // Koleksiyonları temizle
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('Koleksiyonlar temizlendi');

    // Test kullanıcıları oluştur
    const users = await User.create([
      {
        name: 'Ahmet Yılmaz',
        email: 'customer@example.com',
        password: 'password123',
        phone: '05551234567',
        role: 'user'
      },
      {
        name: "Fatma's Laundry",
        email: 'owner@example.com',
        password: 'password123',
        phone: '05559876543',
        role: 'owner'
      },
      {
        name: 'Ali Kurye',
        email: 'courier@example.com',
        password: 'password123',
        phone: '05552468135',
        role: 'courier'
      }
    ]);

    console.log('Kullanıcılar oluşturuldu');

    // Ürünleri oluştur
    const products = await Product.create([
      {
        name: 'Standart Çamaşır Yıkama',
        description: 'Günlük giysilerin standart yıkama hizmeti',
        serviceType: 'standard',
        basePrice: 15,
        pricePerKg: 3.5,
        estimatedDays: 3
      },
      {
        name: 'Hızlı Yıkama',
        description: '24 saat içinde yıkama ve teslim',
        serviceType: 'express',
        basePrice: 25,
        pricePerKg: 5,
        estimatedDays: 1
      },
      {
        name: 'Kuru Temizlik',
        description: 'Hassas kumaşlar için kuru temizlik',
        serviceType: 'dry_clean',
        basePrice: 30,
        pricePerKg: 8,
        estimatedDays: 3
      },
      {
        name: 'Ütüleme Hizmeti',
        description: 'Yıkanan çamaşırların ütülenmesi',
        serviceType: 'standard',
        basePrice: 10,
        pricePerKg: 2,
        estimatedDays: 2
      }
    ]);

    console.log('Ürünler oluşturuldu');

    console.log('✓ Veritabanı başarıyla seed edildi!');
    console.log('\nTest Hesapları:');
    console.log('Müşteri: customer@example.com / password123');
    console.log('İşletme Sahibi: owner@example.com / password123');
    console.log('Kurye: courier@example.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Seed hatası:', error);
    process.exit(1);
  }
};

seedDatabase();
