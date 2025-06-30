import os
import random
import psycopg2
from io import BytesIO
from PIL import Image

MAX_DIMENSION = 500  # pixels
MALE_DIR = "/app/data/images/male"
FEMALE_DIR = "/app/data/images/female"

# DB credentials from environment
DB_PARAMS = {
    "dbname": os.getenv("POSTGRES_DB"),
    "user": os.getenv("POSTGRES_USER"),
    "password": os.getenv("POSTGRES_PASSWORD"),
    "host": os.getenv("POSTGRES_HOST"),
    "port": os.getenv("POSTGRES_PORT"),
}

def process_image(image_path: str) -> bytes:
    img = Image.open(image_path).convert("RGB")
    max_side = max(img.size)
    scale = MAX_DIMENSION / max_side
    new_size = tuple(int(dim * scale) for dim in img.size)
    img = img.resize(new_size, Image.LANCZOS)
    output = BytesIO()
    img.save(output, format="JPEG", quality=80)
    return output.getvalue()

def main():
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()

    cur.execute("SELECT users.id, gender FROM users JOIN profiles ON users.id = profiles.user_id;")
    users = cur.fetchall()

    for user_id, gender in users:
        if random.random() < 0.3:
            continue  # Environ 30% des users n'ont pas de photo

        img_dir = MALE_DIR if gender == "male" else FEMALE_DIR
        img_files = [f for f in os.listdir(img_dir) if f.endswith(".jpg") or f.endswith(".jpeg")]

        nb_images = random.randint(1, 2)
        selected_imgs = random.sample(img_files, nb_images)

        for i, img_name in enumerate(selected_imgs):
            path = os.path.join(img_dir, img_name)
            img_bytes = process_image(path)

            cur.execute(
                """
                INSERT INTO profile_pictures (user_id, image_data, is_profile_picture)
                VALUES (%s, %s, %s);
                """,
                (user_id, psycopg2.Binary(img_bytes), i == 0)
            )

    conn.commit()
    cur.close()
    conn.close()
    print("✅ Images insérées !")

if __name__ == "__main__":
    main()