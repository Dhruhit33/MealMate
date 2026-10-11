-- =====================================================================
-- FoodRush — Restaurant Seed Data with Real Images
-- Run against your restaurant-service database (likely "restaurant_db")
-- =====================================================================
-- HOW TO RUN:
--   Option A (command line):
--     mysql -u root -p restaurant_db < phase2-seed.sql
--
--   Option B (MySQL Workbench):
--     File → Open SQL Script → select this file → run (Ctrl+Shift+Enter)
--
--   Option C (MySQL CLI interactive):
--     mysql -u root -p
--     USE restaurant_db;
--     source C:/path/to/phase2-seed.sql;
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE menu_items;
TRUNCATE TABLE categories;
TRUNCATE TABLE reviews;
TRUNCATE TABLE restaurants;
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- RESTAURANTS (with real Unsplash cover images)
-- =====================================================================
INSERT INTO restaurants
(restaurant_id, owner_id, name, description, cuisine_type, address, latitude, longitude,
 avg_rating, total_reviews, avg_delivery_time_mins, min_order_amount, is_open,
 opening_time, closing_time, image_url, phone, created_at)
VALUES

('r1-spice-garden', 'owner-1',
 'Spice Garden',
 'Handcrafted North Indian classics — rich curries, melt-in-mouth kebabs, and clay-oven breads. A Delhi institution since 1975.',
 'North Indian', 'Connaught Place, New Delhi',
 28.6315, 77.2167, 4.6, 248, 28, 150, 1,
 '10:00:00', '23:00:00',
 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&q=80',
 '+91-9876543210', NOW()),

('r2-dragon-palace', 'owner-2',
 'Dragon Palace',
 'Szechuan heat, Cantonese precision. Wok-tossed noodles and hand-folded dim sum that arrive steaming.',
 'Chinese', 'Khan Market, New Delhi',
 28.6000, 77.2270, 4.3, 186, 32, 200, 1,
 '11:00:00', '23:30:00',
 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1200&q=80',
 '+91-9876543211', NOW()),

('r3-pizza-paradise', 'owner-3',
 'Pizza Paradise',
 'Neapolitan-style wood-fired pizzas with San Marzano tomatoes and imported buffalo mozzarella.',
 'Italian', 'Hauz Khas Village, New Delhi',
 28.5540, 77.1960, 4.7, 412, 25, 250, 1,
 '12:00:00', '00:00:00',
 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80',
 '+91-9876543212', NOW()),

('r4-biryani-house', 'owner-4',
 'Biryani House',
 'Slow-cooked dum biryani with a 25-year-old family recipe. Every grain of basmati tells a story.',
 'Biryani', 'Nizamuddin, New Delhi',
 28.5870, 77.2430, 4.8, 567, 38, 180, 1,
 '11:30:00', '23:00:00',
 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=1200&q=80',
 '+91-9876543213', NOW()),

('r5-dosa-corner', 'owner-5',
 'Dosa Corner',
 'Crispy paper dosas, fluffy idlis, and filter coffee that tastes like a Madras morning.',
 'South Indian', 'Lajpat Nagar, New Delhi',
 28.5670, 77.2430, 4.5, 324, 22, 100, 1,
 '07:00:00', '22:00:00',
 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=1200&q=80',
 '+91-9876543214', NOW()),

('r6-sweet-tooth', 'owner-6',
 'Sweet Tooth Bakery',
 'Artisanal cakes, French pastries, and gelato made fresh every morning from European recipes.',
 'Desserts', 'Vasant Kunj, New Delhi',
 28.5200, 77.1590, 4.4, 156, 30, 200, 1,
 '09:00:00', '22:30:00',
 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=1200&q=80',
 '+91-9876543215', NOW()),

('r7-green-bowl', 'owner-7',
 'Green Bowl',
 'Fresh salads, grain bowls, and cold-pressed juices. Wellness that actually tastes good.',
 'Continental', 'Saket, New Delhi',
 28.5260, 77.2070, 4.2, 98, 25, 150, 1,
 '08:00:00', '21:00:00',
 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80',
 '+91-9876543216', NOW()),

('r8-grill-master', 'owner-8',
 'The Grill Master',
 'Charcoal-grilled tikkas, kebabs, and rolls. Smoky, juicy, unforgettable.',
 'North Indian', 'Karol Bagh, New Delhi',
 28.6520, 77.1910, 4.5, 389, 35, 200, 0,
 '16:00:00', '01:00:00',
 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=1200&q=80',
 '+91-9876543217', NOW());

-- =====================================================================
-- CATEGORIES
-- =====================================================================
INSERT INTO categories (category_id, restaurant_id, name, description, display_order) VALUES
-- Spice Garden
('cat-sg-1', 'r1-spice-garden', 'Starters', 'Crispy, saucy, perfect to begin', 1),
('cat-sg-2', 'r1-spice-garden', 'Main Course', 'Our signature curries', 2),
('cat-sg-3', 'r1-spice-garden', 'Breads', 'Fresh from the tandoor', 3),
('cat-sg-4', 'r1-spice-garden', 'Rice & Biryani', 'Aromatic and hearty', 4),
('cat-sg-5', 'r1-spice-garden', 'Desserts', 'Sweet endings', 5),
-- Dragon Palace
('cat-dp-1', 'r2-dragon-palace', 'Dim Sum', 'Hand-folded, steamed to perfection', 1),
('cat-dp-2', 'r2-dragon-palace', 'Soups', 'Slow-simmered broths', 2),
('cat-dp-3', 'r2-dragon-palace', 'Noodles', 'Hand-pulled and wok-tossed', 3),
('cat-dp-4', 'r2-dragon-palace', 'Mains', 'Szechuan and Cantonese classics', 4),
-- Pizza Paradise
('cat-pp-1', 'r3-pizza-paradise', 'Pizzas', 'Wood-fired, 90-second bake', 1),
('cat-pp-2', 'r3-pizza-paradise', 'Pastas', 'Fresh-made daily', 2),
('cat-pp-3', 'r3-pizza-paradise', 'Salads', 'Crisp and vibrant', 3),
('cat-pp-4', 'r3-pizza-paradise', 'Desserts', 'Italian sweets', 4),
-- Biryani House
('cat-bh-1', 'r4-biryani-house', 'Signature Biryanis', 'The house specialty', 1),
('cat-bh-2', 'r4-biryani-house', 'Kebabs', 'Charcoal-grilled starters', 2),
('cat-bh-3', 'r4-biryani-house', 'Curries', 'Rich and slow-cooked', 3),
-- Dosa Corner
('cat-dc-1', 'r5-dosa-corner', 'Dosas', 'Crispy rice-lentil crepes', 1),
('cat-dc-2', 'r5-dosa-corner', 'Idli & Vada', 'Steamed and fried classics', 2),
('cat-dc-3', 'r5-dosa-corner', 'Uttapam', 'Thick pancakes with toppings', 3),
('cat-dc-4', 'r5-dosa-corner', 'Beverages', 'Filter coffee and more', 4);

-- =====================================================================
-- MENU ITEMS (every item has a real image)
-- =====================================================================

-- Spice Garden
INSERT INTO menu_items (item_id, restaurant_id, category_id, name, description, price, image_url, is_veg, is_available, is_bestseller) VALUES
('mi-sg-1',  'r1-spice-garden', 'cat-sg-1', 'Paneer Tikka', 'Cottage cheese cubes marinated in spiced yogurt, grilled in the tandoor.', 320, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=80', 1, 1, 1),
('mi-sg-2',  'r1-spice-garden', 'cat-sg-1', 'Chicken Malai Tikka', 'Chicken thigh in cream, cashew, and green cardamom marinade.', 420, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80', 0, 1, 1),
('mi-sg-3',  'r1-spice-garden', 'cat-sg-1', 'Dahi Ke Kebab', 'Hung curd croquettes with chopped nuts. Crisp shell, silky inside.', 290, 'https://images.unsplash.com/photo-1606471191009-63994c53433b?w=600&q=80', 1, 1, 0),
('mi-sg-4',  'r1-spice-garden', 'cat-sg-2', 'Butter Chicken', 'The classic. Tandoor-roasted chicken in a velvety tomato-butter gravy. Recipe from 1955.', 480, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80', 0, 1, 1),
('mi-sg-5',  'r1-spice-garden', 'cat-sg-2', 'Dal Makhani', 'Black lentils slow-simmered overnight with cream and butter. 14 hours.', 340, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&q=80', 1, 1, 1),
('mi-sg-6',  'r1-spice-garden', 'cat-sg-2', 'Paneer Butter Masala', 'Soft paneer in rich tomato-cashew gravy, finished with kasuri methi.', 380, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80', 1, 1, 0),
('mi-sg-7',  'r1-spice-garden', 'cat-sg-2', 'Rogan Josh', 'Kashmiri lamb curry with fennel, ginger, saffron. Deep, aromatic.', 540, 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80', 0, 1, 0),
('mi-sg-8',  'r1-spice-garden', 'cat-sg-3', 'Garlic Naan', 'Leavened bread with garlic and coriander, baked in the tandoor.', 80, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80', 1, 1, 0),
('mi-sg-9',  'r1-spice-garden', 'cat-sg-3', 'Butter Roti', 'Whole wheat flatbread brushed with melted butter.', 45, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80', 1, 1, 0),
('mi-sg-10', 'r1-spice-garden', 'cat-sg-4', 'Hyderabadi Chicken Biryani', 'Long-grain basmati layered with saffron-marinated chicken, dum-cooked.', 420, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', 0, 1, 1),
('mi-sg-11', 'r1-spice-garden', 'cat-sg-4', 'Veg Biryani', 'Basmati with garden vegetables, whole spices, and brown onions.', 320, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80', 1, 1, 0),
('mi-sg-12', 'r1-spice-garden', 'cat-sg-5', 'Gulab Jamun', 'Warm milk-solid dumplings in cardamom-rose syrup. Two pieces.', 140, 'https://images.unsplash.com/photo-1601303516361-1f0706d2ef35?w=600&q=80', 1, 1, 0),
('mi-sg-13', 'r1-spice-garden', 'cat-sg-5', 'Ras Malai', 'Cottage cheese discs in saffron-kissed thickened milk. Chilled.', 180, 'https://images.unsplash.com/photo-1589119908995-c6837fa14848?w=600&q=80', 1, 1, 0);

-- Dragon Palace
INSERT INTO menu_items (item_id, restaurant_id, category_id, name, description, price, image_url, is_veg, is_available, is_bestseller) VALUES
('mi-dp-1', 'r2-dragon-palace', 'cat-dp-1', 'Veg Dim Sum Platter', 'Six hand-folded dumplings — spinach, mushroom, water chestnut.', 380, 'https://images.unsplash.com/photo-1625398407796-82650a8c135f?w=600&q=80', 1, 1, 1),
('mi-dp-2', 'r2-dragon-palace', 'cat-dp-1', 'Chicken Shumai', 'Open-top dumplings with a prawn roe crown.', 440, 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&q=80', 0, 1, 1),
('mi-dp-3', 'r2-dragon-palace', 'cat-dp-2', 'Hot & Sour Soup', 'Mushroom, tofu, and bamboo shoots in a tangy-spicy broth.', 220, 'https://images.unsplash.com/photo-1547308283-b941e55a41fa?w=600&q=80', 1, 1, 0),
('mi-dp-4', 'r2-dragon-palace', 'cat-dp-3', 'Hakka Noodles', 'Wok-fried egg noodles with vegetables and soy. Street-food classic.', 280, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&q=80', 1, 1, 1),
('mi-dp-5', 'r2-dragon-palace', 'cat-dp-3', 'Chilli Garlic Noodles', 'Flat noodles tossed in a fiery chilli-garlic sauce. Order water.', 320, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80', 1, 1, 0),
('mi-dp-6', 'r2-dragon-palace', 'cat-dp-4', 'Kung Pao Chicken', 'Diced chicken with peanuts, dried chilies, Szechuan peppercorns.', 460, 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&q=80', 0, 1, 1),
('mi-dp-7', 'r2-dragon-palace', 'cat-dp-4', 'Mapo Tofu', 'Silken tofu in numbing chilli sauce with minced pork. Traditional Szechuan.', 420, 'https://images.unsplash.com/photo-1541379524304-4b4d4bf96bc9?w=600&q=80', 0, 1, 0);

-- Pizza Paradise
INSERT INTO menu_items (item_id, restaurant_id, category_id, name, description, price, image_url, is_veg, is_available, is_bestseller) VALUES
('mi-pp-1', 'r3-pizza-paradise', 'cat-pp-1', 'Margherita', 'San Marzano tomatoes, buffalo mozzarella, basil, olive oil.', 380, 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600&q=80', 1, 1, 1),
('mi-pp-2', 'r3-pizza-paradise', 'cat-pp-1', 'Quattro Formaggi', 'Four cheese — mozzarella, gorgonzola, parmigiano, fontina.', 520, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80', 1, 1, 0),
('mi-pp-3', 'r3-pizza-paradise', 'cat-pp-1', 'Prosciutto e Funghi', 'Ham and mushroom with light tomato base and mozzarella.', 580, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80', 0, 1, 1),
('mi-pp-4', 'r3-pizza-paradise', 'cat-pp-2', 'Spaghetti Carbonara', 'Egg yolk, guanciale, pecorino romano, black pepper. Roman style.', 460, 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&q=80', 0, 1, 1),
('mi-pp-5', 'r3-pizza-paradise', 'cat-pp-2', 'Penne Arrabiata', 'Fiery tomato sauce with garlic, chili, fresh parsley.', 380, 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=600&q=80', 1, 1, 0),
('mi-pp-6', 'r3-pizza-paradise', 'cat-pp-3', 'Caesar Salad', 'Romaine, croutons, parmesan, anchovy dressing, soft egg.', 320, 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=600&q=80', 0, 1, 0),
('mi-pp-7', 'r3-pizza-paradise', 'cat-pp-4', 'Tiramisu', 'Espresso-soaked savoiardi, mascarpone cream, bitter cocoa.', 260, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80', 1, 1, 0);

-- Biryani House
INSERT INTO menu_items (item_id, restaurant_id, category_id, name, description, price, image_url, is_veg, is_available, is_bestseller) VALUES
('mi-bh-1', 'r4-biryani-house', 'cat-bh-1', 'Hyderabadi Chicken Dum Biryani', 'Basmati sealed in dough, slow-cooked over embers. The family recipe.', 380, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80', 0, 1, 1),
('mi-bh-2', 'r4-biryani-house', 'cat-bh-1', 'Lucknowi Mutton Biryani', 'Aromatic, mild, layered. Mutton falls off the bone.', 480, 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&q=80', 0, 1, 1),
('mi-bh-3', 'r4-biryani-house', 'cat-bh-1', 'Veg Dum Biryani', 'Basmati with assorted vegetables, saffron, and kewra.', 320, 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80', 1, 1, 0),
('mi-bh-4', 'r4-biryani-house', 'cat-bh-2', 'Seekh Kebab', 'Minced mutton with green chili and mint, grilled on iron skewers.', 360, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', 0, 1, 0),
('mi-bh-5', 'r4-biryani-house', 'cat-bh-2', 'Hara Bhara Kebab', 'Spinach, peas, and paneer cakes with a hint of cumin.', 280, 'https://images.unsplash.com/photo-1606471191009-63994c53433b?w=600&q=80', 1, 1, 0),
('mi-bh-6', 'r4-biryani-house', 'cat-bh-3', 'Mutton Rogan Josh', 'Kashmiri-style lamb curry with ratan jot and fennel.', 540, 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600&q=80', 0, 1, 0);

-- Dosa Corner
INSERT INTO menu_items (item_id, restaurant_id, category_id, name, description, price, image_url, is_veg, is_available, is_bestseller) VALUES
('mi-dc-1', 'r5-dosa-corner', 'cat-dc-1', 'Masala Dosa', 'Crispy crepe with spiced potato, coconut chutney, sambar.', 140, 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600&q=80', 1, 1, 1),
('mi-dc-2', 'r5-dosa-corner', 'cat-dc-1', 'Paper Roast Dosa', 'Extra-thin, extra-crispy. Just ghee and salt. Three chutneys.', 160, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80', 1, 1, 1),
('mi-dc-3', 'r5-dosa-corner', 'cat-dc-1', 'Mysore Masala Dosa', 'Red chutney smear and potato filling. Karnataka staple.', 180, 'https://images.unsplash.com/photo-1694849789325-914f34303a23?w=600&q=80', 1, 1, 0),
('mi-dc-4', 'r5-dosa-corner', 'cat-dc-2', 'Idli Sambar', '3 steamed rice-lentil cakes with sambar and coconut chutney.', 100, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&q=80', 1, 1, 1),
('mi-dc-5', 'r5-dosa-corner', 'cat-dc-2', 'Medu Vada', '2 crispy lentil donuts, golden outside, fluffy inside.', 90, 'https://images.unsplash.com/photo-1626777553635-cbe57be07d39?w=600&q=80', 1, 1, 0),
('mi-dc-6', 'r5-dosa-corner', 'cat-dc-3', 'Onion Uttapam', 'Thick pancake with caramelized onions, green chili, coriander.', 140, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80', 1, 1, 0),
('mi-dc-7', 'r5-dosa-corner', 'cat-dc-4', 'Filter Coffee', 'South Indian decoction with hot milk. A generous spoon of sugar.', 60, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80', 1, 1, 0);

-- Sweet Tooth Bakery
INSERT INTO menu_items (item_id, restaurant_id, category_id, name, description, price, image_url, is_veg, is_available, is_bestseller) VALUES
('mi-st-1', 'r6-sweet-tooth', NULL, 'Dark Chocolate Truffle Cake', 'Seven layers. 70% Belgian dark chocolate. Chilled.', 680, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80', 1, 1, 1),
('mi-st-2', 'r6-sweet-tooth', NULL, 'Red Velvet Cupcakes', 'Southern-style with cream cheese frosting. Box of 6.', 420, 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=600&q=80', 1, 1, 1),
('mi-st-3', 'r6-sweet-tooth', NULL, 'Tiramisu Jar', 'Layered espresso-soaked sponge with mascarpone.', 220, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80', 1, 1, 0),
('mi-st-4', 'r6-sweet-tooth', NULL, 'Pistachio Gelato', 'Made with Sicilian pistachios. 100g tub.', 180, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80', 1, 1, 0);

-- Green Bowl
INSERT INTO menu_items (item_id, restaurant_id, category_id, name, description, price, image_url, is_veg, is_available, is_bestseller) VALUES
('mi-gb-1', 'r7-green-bowl', NULL, 'Buddha Bowl', 'Quinoa, sweet potato, chickpeas, avocado, tahini dressing.', 380, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80', 1, 1, 1),
('mi-gb-2', 'r7-green-bowl', NULL, 'Grilled Chicken Salad', 'Mixed greens, grilled chicken, cherry tomatoes, balsamic.', 420, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80', 0, 1, 1),
('mi-gb-3', 'r7-green-bowl', NULL, 'Cold Pressed Green Juice', 'Kale, cucumber, apple, lemon, ginger. 300ml.', 180, 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=600&q=80', 1, 1, 0);

-- Grill Master
INSERT INTO menu_items (item_id, restaurant_id, category_id, name, description, price, image_url, is_veg, is_available, is_bestseller) VALUES
('mi-gm-1', 'r8-grill-master', NULL, 'Chicken Tikka', 'Chicken marinated overnight, charcoal-grilled.', 380, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&q=80', 0, 1, 1),
('mi-gm-2', 'r8-grill-master', NULL, 'Mutton Galouti Kebab', 'Melt-in-mouth minced mutton patties, Lucknowi style.', 480, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80', 0, 1, 1),
('mi-gm-3', 'r8-grill-master', NULL, 'Tandoori Paneer Tikka', 'Thick paneer cubes with bell peppers, yogurt-marinated.', 340, 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&q=80', 1, 1, 0);

-- =====================================================================
-- SAMPLE REVIEWS
-- =====================================================================
INSERT INTO reviews (review_id, restaurant_id, user_id, rating, comment, user_name, created_at) VALUES
('rev-1', 'r1-spice-garden', 'user-a', 5, 'The butter chicken here is legendary. Ordered it for a family dinner and got compliments all around. Will order again soon!', 'Priya S.', NOW()),
('rev-2', 'r1-spice-garden', 'user-b', 4, 'Good food, hot and on time. The dal makhani is my favorite part — you can taste the overnight cooking.', 'Rahul K.', NOW()),
('rev-3', 'r1-spice-garden', 'user-c', 5, 'Rogan josh tasted exactly like my grandmother used to make. Portions are generous, packaging is premium.', 'Ananya M.', NOW()),
('rev-4', 'r3-pizza-paradise', 'user-d', 5, 'Best Margherita in Delhi, full stop. The crust is properly blistered, and you can tell they use real buffalo mozzarella.', 'Karan J.', NOW()),
('rev-5', 'r4-biryani-house', 'user-e', 5, 'The dum biryani is next level. Actually tastes like it was slow-cooked. Meat falls apart, rice is fluffy.', 'Meera R.', NOW());

SELECT '✓ Seed complete' AS status, COUNT(*) AS restaurants, (SELECT COUNT(*) FROM menu_items) AS menu_items, (SELECT COUNT(*) FROM categories) AS categories FROM restaurants;
