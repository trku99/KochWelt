-- Seed data for KochWelt
-- First, create categories
INSERT INTO categories (name, slug, icon, description) VALUES
  ('Vorspeisen', 'vorspeisen', '🥗', 'Leichte Gerichte für den Anfang'),
  ('Suppen', 'suppen', '🍜', 'Wärmende Suppen und Eintöpfe'),
  ('Hauptgerichte', 'hauptgerichte', '🍽️', 'Herzhafte Hauptgerichte'),
  ('Beilagen', 'beilagen', '🥔', 'Passende Beilagen zu jedem Gericht'),
  ('Desserts', 'desserts', '🍰', 'Süsse Verführungen'),
  ('Backen', 'backen', '🥖', 'Brot, Kuchen und Gebäck'),
  ('Salate', 'salate', '🥗', 'Frische Salatkreationen'),
  ('Getränke', 'getraenke', '🍹', 'Erfrischende Getränke');

-- Insert tags
INSERT INTO tags (name, slug) VALUES
  ('Vegetarisch', 'vegetarisch'),
  ('Vegan', 'vegan'),
  ('Glutenfrei', 'glutenfrei'),
  ('Laktosefrei', 'laktosefrei'),
  ('Schnell', 'schnell'),
  ('Gesund', 'gesund'),
  ('Party', 'party'),
  ('Grillen', 'grillen'),
  ('Herbst', 'herbst'),
  ('Sommer', 'sommer'),
  ('Traditionell', 'traditionell'),
  ('International', 'international');

-- Sample recipes (will need profile UUIDs, so we use a placeholder approach)
-- We'll create recipes using subqueries for the author_id

-- Helper: Create a profile for the seed user
INSERT INTO auth.users (id, email) VALUES ('00000000-0000-0000-0000-000000000001', 'kochwelt@example.com');
INSERT INTO profiles (id, username, display_name, bio) VALUES
  ('00000000-0000-0000-0000-000000000001', 'kochwelt', 'KochWelt Redaktion', 'Die KochWelt Redaktion testet und teilt die besten Rezepte.');

-- Recipes
INSERT INTO recipes (title, slug, description, author_id, category_id, difficulty, prep_time_minutes, cook_time_minutes, servings, image_url, is_published, view_count, avg_rating, rating_count)
VALUES
  ('Zürcher Geschnetzeltes', 'zuerich-geschnetzeltes', 'Das klassische Zürcher Geschnetzeltes mit Kalbfleisch in einer cremigen Weisswein-Sauce.', '00000000-0000-0000-0000-000000000001', 3, 'Mittel', 20, 25, 4, NULL, true, 152, 4.5, 12),
  ('Rösti', 'roesti', 'Knusprige Schweizer Rösti – goldbraun und perfekt als Beilage oder Hauptgericht.', '00000000-0000-0000-0000-000000000001', 4, 'Einfach', 15, 30, 4, NULL, true, 234, 4.8, 18),
  ('Basler Mehlsuppe', 'basler-mehlsuppe', 'Eine traditionelle Basler Mehlsuppe – herzhaft und wärmend.', '00000000-0000-0000-0000-000000000001', 2, 'Einfach', 10, 30, 4, NULL, true, 89, 4.2, 7),
  ('Cheese Fondue', 'cheese-fondue', 'Das ultimative Schweizer Fondue mit einer Mischung aus Greyerzer und Vacherin.', '00000000-0000-0000-0000-000000000001', 3, 'Mittel', 15, 20, 4, NULL, true, 312, 4.9, 25),
  ('Nüsslisalat mit Birnen', 'nuesslisalat-mit-birnen', 'Feldsalat mit reifen Birnen, Walnüssen und einem leichten Senf-Dressing.', '00000000-0000-0000-0000-000000000001', 7, 'Einfach', 15, 0, 2, NULL, true, 67, 4.3, 9),
  ('Schokoladenkuchen', 'schokoladenkuchen', 'Saftiger Schokoladenkuchen mit flüssigem Kern – ein Genuss für jede Gelegenheit.', '00000000-0000-0000-0000-000000000001', 6, 'Mittel', 25, 35, 8, NULL, true, 195, 4.7, 21),
  ('Bündner Gerstensuppe', 'buendner-gerstensuppe', 'Herzhafte Gerstensuppe nach Bündner Art mit Rauchfleisch und Gemüse.', '00000000-0000-0000-0000-000000000001', 2, 'Schwer', 20, 90, 6, NULL, true, 78, 4.6, 11),
  ('Apfelstrudel', 'apfelstrudel', 'Klassischer Apfelstrudel mit dünnem Teig, Zimt und Rosinen – warm serviert.', '00000000-0000-0000-0000-000000000001', 5, 'Schwer', 40, 45, 8, NULL, true, 143, 4.4, 15);

-- Ingredients for each recipe
-- Recipe 1: Zürcher Geschnetzeltes
INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order) VALUES
  (1, 'Kalbfleisch (Geschnetzeltes)', 600, 'g', 1),
  (1, 'Zwiebeln', 2, 'Stück', 2),
  (1, 'Champignons', 200, 'g', 3),
  (1, 'Weisswein', 150, 'ml', 4),
  (1, 'Rahm', 200, 'ml', 5),
  (1, 'Butter', 2, 'EL', 6),
  (1, 'Salz', 1, 'TL', 7),
  (1, 'Pfeffer', 0.5, 'TL', 8);

-- Recipe 2: Rösti
INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order) VALUES
  (2, 'Kartoffeln (festkochend)', 800, 'g', 1),
  (2, 'Butter', 3, 'EL', 2),
  (2, 'Salz', 1, 'TL', 3),
  (2, 'Pfeffer', 0.5, 'TL', 4),
  (2, 'Muskatnuss (gerieben)', 0.25, 'TL', 5);

-- Recipe 3: Basler Mehlsuppe
INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order) VALUES
  (3, 'Butter', 80, 'g', 1),
  (3, 'Mehl', 80, 'g', 2),
  (3, 'Rinderbrühe', 1.5, 'l', 3),
  (3, 'Zwiebeln', 2, 'Stück', 4),
  (3, 'Muskatnuss', 0.5, 'TL', 5),
  (3, 'Salz', 0.5, 'TL', 6),
  (3, 'Pfeffer', 0.25, 'TL', 7),
  (3, 'Schnittlauch', 1, 'EL', 8);

-- Recipe 4: Cheese Fondue
INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order) VALUES
  (4, 'Greyerzer (gerieben)', 400, 'g', 1),
  (4, 'Vacherin (gerieben)', 400, 'g', 2),
  (4, 'Knoblauchzehe', 1, 'Stück', 3),
  (4, 'Weisswein', 300, 'ml', 4),
  (4, 'Kirsch', 50, 'ml', 5),
  (4, 'Maisstärke', 2, 'EL', 6),
  (4, 'Muskatnuss', 0.25, 'TL', 7),
  (4, 'Pfeffer', 0.25, 'TL', 8),
  (4, 'Brotwürfel', 800, 'g', 9);

-- Recipe 5: Nüsslisalat mit Birnen
INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order) VALUES
  (5, 'Feldsalat (Nüsslisalat)', 150, 'g', 1),
  (5, 'Birnen (reif)', 2, 'Stück', 2),
  (5, 'Walnüsse', 60, 'g', 3),
  (5, 'Rahm', 3, 'EL', 4),
  (5, 'Senf (mittelscharf)', 1, 'EL', 5),
  (5, 'Essig (weiss)', 2, 'EL', 6),
  (5, 'Öl (Raps)', 3, 'EL', 7),
  (5, 'Salz', 0.5, 'TL', 8),
  (5, 'Pfeffer', 0.25, 'TL', 9);

-- Recipe 6: Schokoladenkuchen
INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order) VALUES
  (6, 'Zartbitterschokolade', 200, 'g', 1),
  (6, 'Butter', 150, 'g', 2),
  (6, 'Zucker', 180, 'g', 3),
  (6, 'Eier', 4, 'Stück', 4),
  (6, 'Mehl', 80, 'g', 5),
  (6, 'Kakaopulver', 30, 'g', 6),
  (6, 'Vanilleextrakt', 1, 'TL', 7),
  (6, 'Salz', 0.25, 'TL', 8);

-- Recipe 7: Bündner Gerstensuppe
INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order) VALUES
  (7, 'Gerste (Rollegerste)', 150, 'g', 1),
  (7, 'Rauchfleisch (Bündnerfleisch)', 200, 'g', 2),
  (7, 'Karotten', 2, 'Stück', 3),
  (7, 'Sellerie', 100, 'g', 4),
  (7, 'Lauch', 1, 'Stück', 5),
  (7, 'Kartoffeln', 200, 'g', 6),
  (7, 'Rinderbrühe', 1.5, 'l', 7),
  (7, 'Lorbeerblatt', 2, 'Stück', 8),
  (7, 'Salz', 1, 'TL', 9),
  (7, 'Pfeffer', 0.5, 'TL', 10);

-- Recipe 8: Apfelstrudel
INSERT INTO ingredients (recipe_id, name, amount, unit, sort_order) VALUES
  (8, 'Strudelteigblätter', 4, 'Stück', 1),
  (8, 'Äpfel (säuerlich)', 1, 'kg', 2),
  (8, 'Zucker', 100, 'g', 3),
  (8, 'Zimt', 2, 'TL', 4),
  (8, 'Rosinen', 80, 'g', 5),
  (8, 'Butter (flüssig)', 80, 'g', 6),
  (8, 'Semmelbrösel', 50, 'g', 7),
  (8, 'Puderzucker', 1, 'EL', 8);

-- Steps for each recipe
-- Recipe 1: Zürcher Geschnetzeltes
INSERT INTO steps (recipe_id, step_number, instruction) VALUES
  (1, 1, 'Das Kalbfleisch in feine Streifen schneiden. Zwiebeln halbieren und in Ringe schneiden. Champignons putzen und vierteln.'),
  (1, 2, 'Butter in einer Pfanne erhitzen. Das Fleisch portionsweise scharf anbraten, herausnehmen und warm stellen.'),
  (1, 3, 'Zwiebeln und Champignons im Bratensatz anbraten, bis sie goldbraun sind.'),
  (1, 4, 'Mit Weisswein ablöschen und kurz aufkochen lassen. Den Rahm dazugiessen und unter Rühren köcheln lassen.'),
  (1, 5, 'Das Fleisch wieder in die Sauce geben, mit Salz und Pfeffer abschmecken. Vor dem Servieren nochmals kurz erhitzen.'),
  (1, 6, 'Dazu passen Rösti oder Butterreis.');

-- Recipe 2: Rösti
INSERT INTO steps (recipe_id, step_number, instruction) VALUES
  (2, 1, 'Kartoffeln in Salzwasser ca. 20 Minuten kochen, bis sie bissfest sind. Abgiessen, ausdampfen lassen und etwas auskühlen.'),
  (2, 2, 'Kartoffeln schälen und an der Röstiraffel oder mit einer groben Reibe in eine Schüssel reiben. Mit Salz, Pfeffer und Muskat würzen.'),
  (2, 3, 'Butter in einer beschichteten Bratpfanne erhitzen. Die Kartoffelmasse hineingeben und zu einem flachen Kuchen formen.'),
  (2, 4, 'Bei mittlerer Hitze 15 Minuten goldbraun braten. Dann vorsichtig wenden und die andere Seite ebenfalls goldbraun braten.'),
  (2, 5, 'Auf einem Teller anrichten und nach Belieben mit Spiegelei oder Käse servieren.');

-- Recipe 3: Basler Mehlsuppe
INSERT INTO steps (recipe_id, step_number, instruction) VALUES
  (3, 1, 'Butter in einem grossen Topf schmelzen. Das Mehl dazugeben und unter ständigem Rühren goldbraun rösten.'),
  (3, 2, 'Die Rinderbrühe unter ständigem Rühren dazugiessen, sodass keine Klümpchen entstehen.'),
  (3, 3, 'Zwiebeln fein hacken und in einer kleinen Pfanne mit etwas Butter goldgelb braten.'),
  (3, 4, 'Die gebratenen Zwiebeln zur Suppe geben. Mit Muskat, Salz und Pfeffer würzen.'),
  (3, 5, 'Die Suppe 15 Minuten köcheln lassen. Mit frischem Schnittlauch bestreut servieren.');

-- Recipe 4: Cheese Fondue
INSERT INTO steps (recipe_id, step_number, instruction) VALUES
  (4, 1, 'Knoblauchzehe halbieren und den Caquelon (Fondue-Topf) damit ausreiben.'),
  (4, 2, 'Den Weisswein in den Topf giessen und auf mittlerer Hitze erwärmen.'),
  (4, 3, 'Den geriebenen Käse nach und nach unter ständigem Rühren in den Wein schmelzen.'),
  (4, 4, 'Maisstärke mit dem Kirsch verrühren, zur Käse-Mischung geben und unter Rühren eindicken lassen.'),
  (4, 5, 'Mit Muskatnuss und Pfeffer würzen. Das Fondue auf dem Rechaud servieren. Brotwürfel auf Spiesse stecken und eintauchen.');

-- Recipe 5: Nüsslisalat mit Birnen
INSERT INTO steps (recipe_id, step_number, instruction) VALUES
  (5, 1, 'Feldsalat putzen, waschen und trocken schleudern.'),
  (5, 2, 'Birnen waschen, vierteln, Kerngehäuse entfernen und in feine Spalten schneiden.'),
  (5, 3, 'Walnüsse grob hacken und in einer trockenen Pfanne kurz anrösten.'),
  (5, 4, 'Für das Dressing Rahm, Senf, Essig und Öl verrühren. Mit Salz und Pfeffer abschmecken.'),
  (5, 5, 'Feldsalat mit Birnen und Walnüssen auf Tellern anrichten. Das Dressing darübergeben und sofort servieren.');

-- Recipe 6: Schokoladenkuchen
INSERT INTO steps (recipe_id, step_number, instruction) VALUES
  (6, 1, 'Backofen auf 180°C Ober-/Unterhitze vorheizen. Eine Springform (24 cm) einfetten.'),
  (6, 2, 'Schokolade grob hacken und mit Butter über dem Wasserbad schmelzen. Leicht abkühlen lassen.'),
  (6, 3, 'Eier und Zucker schaumig schlagen. Die geschmolzene Schokoladen-Butter-Mischung unterrühren.'),
  (6, 4, 'Mehl, Kakaopulver, Vanilleextrakt und Salz mischen und unter den Teig heben.'),
  (6, 5, 'Den Teig in die Form füllen und 30–35 Minuten backen. Der Kuchen sollte innen noch leicht feucht sein.'),
  (6, 6, 'Auskühlen lassen, mit Puderzucker bestäuben und nach Belieben mit Sahne servieren.');

-- Recipe 7: Bündner Gerstensuppe
INSERT INTO steps (recipe_id, step_number, instruction) VALUES
  (7, 1, 'Rollegerste in kaltem Wasser einweichen (mind. 2 Stunden, am besten über Nacht).'),
  (7, 2, 'Das Rauchfleisch würfeln. Karotten, Sellerie und Kartoffeln schälen und würfeln. Lauch waschen und in Ringe schneiden.'),
  (7, 3, 'Die eingeweichte Gerste in der Rinderbrühe aufkochen. Rauchfleisch und Lorbeerblätter dazugeben.'),
  (7, 4, 'Nach 30 Minuten die Karotten, Sellerie und Lauch dazugeben. Weitere 30 Minuten köcheln lassen.'),
  (7, 5, 'Kartoffeln dazugeben und weitere 20 Minuten kochen, bis alles weich ist.'),
  (7, 6, 'Mit Salz und Pfeffer abschmecken. Heiss servieren – am nächsten Tag schmeckt sie noch besser.');

-- Recipe 8: Apfelstrudel
INSERT INTO steps (recipe_id, step_number, instruction) VALUES
  (8, 1, 'Backofen auf 180°C vorheizen. Ein Backblech mit Backpapier auslegen.'),
  (8, 2, 'Äpfel schälen, vierteln, Kerngehäuse entfernen und in feine Scheiben schneiden.'),
  (8, 3, 'Apfelscheiben mit Zucker, Zimt, Rosinen und Semmelbröseln vermischen.'),
  (8, 4, 'Strudelteigblätter auslegen. Jeweils mit etwas flüssiger Butter bestreichen. Die Apfelfüllung auf der unteren Hälfte verteilen.'),
  (8, 5, 'Den Strudel vorsichtig aufrollen. Mit der Nahtseite nach unten auf das Blech legen. Mit restlicher Butter bestreichen.'),
  (8, 6, '25–30 Minuten goldbraun backen. Vor dem Servieren mit Puderzucker bestäuben. Warm geniessen.');

-- Recipe-Tag assignments
INSERT INTO recipe_tags (recipe_id, tag_id) VALUES
  (1, 11), -- Zürcher Geschnetzeltes -> Traditionell
  (2, 11), -- Rösti -> Traditionell
  (2, 1),  -- Rösti -> Vegetarisch
  (2, 6),  -- Rösti -> Gesund
  (3, 11), -- Basler Mehlsuppe -> Traditionell
  (4, 11), -- Cheese Fondue -> Traditionell
  (4, 7),  -- Cheese Fondue -> Party
  (5, 1),  -- Nüsslisalat -> Vegetarisch
  (5, 2),  -- Nüsslisalat -> Vegan
  (5, 6),  -- Nüsslisalat -> Gesund
  (5, 10), -- Nüsslisalat -> Sommer
  (6, 5),  -- Schokoladenkuchen -> Schnell
  (6, 7),  -- Schokoladenkuchen -> Party
  (7, 11), -- Bündner Gerstensuppe -> Traditionell
  (7, 9),  -- Bündner Gerstensuppe -> Herbst
  (8, 11), -- Apfelstrudel -> Traditionell
  (8, 9);  -- Apfelstrudel -> Herbst

-- Some sample ratings
INSERT INTO ratings (recipe_id, user_id, score, comment) VALUES
  (1, '00000000-0000-0000-0000-000000000001', 5, 'Ein Traum! Schmeckt wie in Zürich.'),
  (2, '00000000-0000-0000-0000-000000000001', 5, 'Perfekt knusprig geworden.'),
  (3, '00000000-0000-0000-0000-000000000001', 4, 'Sehr gut, aber etwas mehr Würze wäre schön.'),
  (4, '00000000-0000-0000-0000-000000000001', 5, 'Das beste Fondue-Rezept!'),
  (5, '00000000-0000-0000-0000-000000000001', 4, 'Frisch und lecker.'),
  (6, '00000000-0000-0000-0000-000000000001', 5, 'Super saftig!'),
  (7, '00000000-0000-0000-0000-000000000001', 5, 'Wie bei der Grossmutter.'),
  (8, '00000000-0000-0000-0000-000000000001', 4, 'Gelungen, aber aufwändig.');
