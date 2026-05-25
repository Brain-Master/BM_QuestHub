BM Quest Hub — Media Sync (Google Drive: BM_QuestHub_Media/Sync)
================================================================

Здесь лежат ВСЕ исходники для сайта. Имена файлов не менять — только заменить содержимое.

Примеры:
  quests/cyber-rhythm/hero-16x9.source.jpg
  quests/cyber-rhythm/catalog-4x3.source.jpg
  schedule/SHIFT-001/hero-16x9.source.jpg
  venues/school-17/logo-256.source.png
  venues/school-17/photo-01-16x10.source.jpg
  venues/school-17/landing-30s.mp4
  venues/school-17/landing-poster.source.jpg
  venues/school-17/activity-gallery/gallery-01.source.jpg
  venues/school-17/activity-gallery/gallery-01.caption.txt
  venues/_default/activity-gallery/gallery-01.source.jpg

Школьный лендинг (/sites/{school}/agenda/):
  — видео и галерея «Как проходят занятия» только через файлы в Sync/
  — venues/_default/ = универсальный альбом и видео по умолчанию
  — venues/{school-scope-slug}/ = свои фото/видео площадки (school-17, school-875, …)
  Подробнее: FOR_DESIGNER → 03_School_agenda_media.pdf (в Design Pack ZIP)

Серые файлы с подписями — заглушки: замените своим экспортом из PSD (FOR_DESIGNER).
Инструкции и шаблоны: папка FOR_DESIGNER на уровень выше.

После замены напишите редактору: нужен make media-push (или make media-drive-pull на сервере).
Не вносите URL картинок в Google Sheets.
