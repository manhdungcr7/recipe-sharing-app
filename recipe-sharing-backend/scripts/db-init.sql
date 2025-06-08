-- scripts/db-init.sql
-- Drop database if exists and create a new one
DROP DATABASE IF EXISTS recipe_sharing;
CREATE DATABASE recipe_sharing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE recipe_sharing;

-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  picture VARCHAR(255) DEFAULT 'default-avatar.jpg',
  google_id VARCHAR(100) UNIQUE,
  gender ENUM('male', 'female', 'other', 'prefer not to say') DEFAULT 'prefer not to say',
  birth_date DATE,
  role ENUM('user', 'admin') DEFAULT 'user',
  is_blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  block_expiry DATETIME,
  total_recipes INT DEFAULT 0,
  total_likes INT DEFAULT 0,
  total_shares INT DEFAULT 0,
  total_saves INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_verified TINYINT DEFAULT 0,
  verification_token VARCHAR(255)
);

-- Recipes table
CREATE TABLE recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  author_id INT NOT NULL,
  image_url VARCHAR(255),
  cooking_time INT NOT NULL,
  thoughts TEXT,
  status ENUM('draft', 'pending_review', 'published', 'rejected') DEFAULT 'draft',
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP NULL,
  shares INT DEFAULT 0,
  pdf_downloads INT DEFAULT 0,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Recipe Ingredients
CREATE TABLE ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  quantity VARCHAR(50) NOT NULL,
  unit VARCHAR(50),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Recipe Steps
CREATE TABLE steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  description TEXT NOT NULL,
  image_url VARCHAR(255),
  video_url VARCHAR(255),
  order_index INT NOT NULL,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Recipe Tags
CREATE TABLE tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

-- Recipe-Tags relationship
CREATE TABLE recipe_tags (
  recipe_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (recipe_id, tag_id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Comments
CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  user_id INT NOT NULL,
  text TEXT NOT NULL,
  image_url VARCHAR(255),
  video_url VARCHAR(255),
  parent_comment_id INT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE SET NULL
);

-- Likes
CREATE TABLE likes (
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Saves
CREATE TABLE saves (
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Followers
CREATE TABLE follows (
  follower_id INT NOT NULL,
  followed_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, followed_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipient_id INT NOT NULL,
  sender_id INT,
  type ENUM('like', 'comment', 'follow', 'save', 'share', 'pdf_download', 'admin_message', 'moderation') NOT NULL,
  content TEXT NOT NULL,
  related_recipe_id INT,
  related_comment_id INT,
  is_read BOOLEAN DEFAULT false,
  require_response BOOLEAN DEFAULT false,
  response_content TEXT,
  response_timestamp TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (related_recipe_id) REFERENCES recipes(id) ON DELETE SET NULL,
  FOREIGN KEY (related_comment_id) REFERENCES comments(id) ON DELETE SET NULL
);

-- Create full-text search indexes
ALTER TABLE recipes ADD FULLTEXT(title, thoughts);
ALTER TABLE ingredients ADD FULLTEXT(name);
ALTER TABLE steps ADD FULLTEXT(description);

-- Create an admin user
INSERT INTO users (name, email, role) 
VALUES ('Admin', 'admin@recipesharing.com', 'admin');