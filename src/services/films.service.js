import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// корректный __dirname для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// путь к data (у тебя она в scripts/data)
const filmsPath = path.resolve(__dirname, '../../scripts/data/films.json');

// загружаем данные
const films = JSON.parse(fs.readFileSync(filmsPath, 'utf-8'));

// возвращает все фильмы
export function getAllFilms() {
  return films;
}

// возвращает фильм по kpId (Кинопоиск ID)
export function getFilmByKpId(kpId) {
  return films.find(f => Number(f.kpId) === Number(kpId));
}