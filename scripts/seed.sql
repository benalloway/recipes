-- seed.sql — idempotent seed data (M1, issue #4)
-- Uses INSERT OR IGNORE against UNIQUE(slug); safe to re-run on local + remote.
-- Groups for tags follow the final reviewed list (issue #4): cuisine, meal,
-- diet, convenience, type.
-- Ingredient categories: produce | protein | dairy | grain | spice | pantry.

INSERT OR IGNORE INTO tags (name, slug) VALUES
  ('italian',      'italian'),
  ('mexican',      'mexican'),
  ('breakfast',    'breakfast'),
  ('lunch',        'lunch'),
  ('dinner',       'dinner'),
  ('dessert',      'dessert'),
  ('snack',        'snack'),
  ('appetizer',    'appetizer'),
  ('gluten-free',  'gluten-free'),
  ('dairy-free',   'dairy-free'),
  ('vegetarian',   'vegetarian'),
  ('vegan',        'vegan'),
  ('fast',         'fast'),
  ('easy',         'easy'),
  ('drink',        'drink'),
  ('hot',          'hot'),
  ('cold',         'cold'),
  ('alcoholic',    'alcoholic');

-- proteins (10)
INSERT OR IGNORE INTO ingredients (name, slug, category) VALUES
  ('chicken breast', 'chicken-breast', 'protein'),
  ('chicken thighs', 'chicken-thighs', 'protein'),
  ('ground beef',    'ground-beef',    'protein'),
  ('ground turkey',  'ground-turkey',  'protein'),
  ('eggs',           'eggs',           'protein'),
  ('salmon',         'salmon',         'protein'),
  ('shrimp',         'shrimp',         'protein'),
  ('bacon',          'bacon',          'protein'),
  ('tofu',           'tofu',           'protein'),
  ('black beans',    'black-beans',    'protein');

-- produce (15)
INSERT OR IGNORE INTO ingredients (name, slug, category) VALUES
  ('onion',           'onion',           'produce'),
  ('garlic',          'garlic',          'produce'),
  ('tomato',          'tomato',          'produce'),
  ('cherry tomatoes', 'cherry-tomatoes', 'produce'),
  ('bell pepper',     'bell-pepper',     'produce'),
  ('carrot',          'carrot',          'produce'),
  ('celery',          'celery',          'produce'),
  ('potato',          'potato',          'produce'),
  ('sweet potato',    'sweet-potato',    'produce'),
  ('spinach',         'spinach',         'produce'),
  ('lettuce',         'lettuce',         'produce'),
  ('avocado',         'avocado',         'produce'),
  ('lemon',           'lemon',           'produce'),
  ('lime',            'lime',            'produce'),
  ('mushroom',        'mushroom',        'produce');

-- dairy (7)
INSERT OR IGNORE INTO ingredients (name, slug, category) VALUES
  ('milk',          'milk',          'dairy'),
  ('butter',        'butter',        'dairy'),
  ('heavy cream',   'heavy-cream',   'dairy'),
  ('sour cream',    'sour-cream',    'dairy'),
  ('cheddar',       'cheddar',       'dairy'),
  ('mozzarella',    'mozzarella',    'dairy'),
  ('parmesan',      'parmesan',      'dairy');

-- grains (7)
INSERT OR IGNORE INTO ingredients (name, slug, category) VALUES
  ('rice',           'rice',           'grain'),
  ('pasta',          'pasta',          'grain'),
  ('flour',          'flour',          'grain'),
  ('bread',          'bread',          'grain'),
  ('tortillas',      'tortillas',      'grain'),
  ('corn tortillas', 'corn-tortillas', 'grain'),
  ('oats',           'oats',           'grain');

-- spices (7)
INSERT OR IGNORE INTO ingredients (name, slug, category) VALUES
  ('salt',          'salt',         'spice'),
  ('black pepper',  'black-pepper', 'spice'),
  ('chili powder',  'chili-powder', 'spice'),
  ('cumin',         'cumin',        'spice'),
  ('paprika',       'paprika',      'spice'),
  ('cayenne',       'cayenne',      'spice'),
  ('cinnamon',      'cinnamon',     'spice');

-- pantry (16)
INSERT OR IGNORE INTO ingredients (name, slug, category) VALUES
  ('chicken broth',  'chicken-broth',  'pantry'),
  ('vegetable broth','vegetable-broth','pantry'),
  ('canned tomato',  'canned-tomato',  'pantry'),
  ('tomato paste',   'tomato-paste',   'pantry'),
  ('soy sauce',      'soy-sauce',      'pantry'),
  ('coconut milk',   'coconut-milk',   'pantry'),
  ('olive oil',      'olive-oil',      'pantry'),
  ('vegetable oil',  'vegetable-oil',  'pantry'),
  ('vinegar',        'vinegar',        'pantry'),
  ('honey',          'honey',          'pantry'),
  ('sugar',          'sugar',          'pantry'),
  ('brown sugar',    'brown-sugar',    'pantry'),
  ('mayonnaise',     'mayonnaise',     'pantry'),
  ('mustard',        'mustard',        'pantry'),
  ('pasta sauce',    'pasta-sauce',    'pantry'),
  ('peanut butter',  'peanut-butter',  'pantry');
