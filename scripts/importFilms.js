import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

/* ================== НАСТРОЙКИ ================== */

const API_KEY = process.env.KP_API_KEY;
const BASE_URL = 'https://api.kinopoisk.dev/v1.4/movie';

// 👉 список Kinopoisk ID
const FILM_IDS = [
  342,
  462682,
  41519,
  41520,
  2656,
  195334,
  301,
];

// путь до data/films.json
const DATA_DIR = path.resolve('./data');
const OUTPUT_FILE = path.join(DATA_DIR, 'films.json');

/* ================== ПРОВЕРКИ ================== */

if (!API_KEY) {
  console.error('❌ KP_API_KEY не найден. Проверь .env файл');
  process.exit(1);
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/* ================== ЧТЕНИЕ СУЩЕСТВУЮЩИХ ================== */

function loadExistingFilms() {
  if (!fs.existsSync(OUTPUT_FILE)) return [];

  try {
    return JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

/* ================== ЗАГРУЗКА ФИЛЬМА ================== */

async function fetchFilm(id) {
  try {
    const res = await fetch(`${BASE_URL}/${id}`, {
      headers: {
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ Ошибка ${res.status} для фильма ${id}`);
      console.error(text);
      return null;
    }

    const data = await res.json();

    return {
      kpId: data.id,                 // 👈 ключевой момент
      title: data.name,
      originalTitle: data.alternativeName || null,
      year: data.year,
      description: data.description,
      poster: data.poster?.url || null,
      rating: data.rating?.kp || null,
      genres: data.genres?.map(g => g.name) || [],
      countries: data.countries?.map(c => c.name) || [],
    };
  } catch (e) {
    console.error(`❌ Ошибка запроса фильма ${id}`);
    console.error(e.message);
    return null;
  }
}

/* ================== RUN ================== */

async function run() {
  const existingFilms = loadExistingFilms();

  // индекс по kpId
  const filmMap = new Map(
    existingFilms.map(f => [Number(f.kpId), f])
  );

  let added = 0;

  for (const id of FILM_IDS) {
    console.log(`🎬 Загружаю фильм ${id}...`);
    const film = await fetchFilm(id);

    if (!film) continue;

    if (!filmMap.has(film.kpId)) {
      filmMap.set(film.kpId, film);
      added++;
      console.log(`✅ Добавлен: ${film.title}`);
    } else {
      console.log(`⏭ Уже есть: ${film.title}`);
    }
  }

  const result = Array.from(filmMap.values());

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(result, null, 2),
    'utf-8'
  );

  console.log(
    `\n🎉 Готово. Всего фильмов: ${result.length}, добавлено новых: ${added}`
  );
}

run();
