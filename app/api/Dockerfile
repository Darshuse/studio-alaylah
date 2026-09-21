# ===== بناء الـjar =====
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

# ===== التشغيل =====
FROM eclipse-temurin:21-jre
WORKDIR /app
# FFmpeg (تركيب الفيديو) + خطوط DejaVu (عربي للكتاب + العلامة المائية)
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*
COPY --from=build /build/target/family-tales-api-0.1.0.jar app.jar
ENV FFMPEG_PATH=/usr/bin/ffmpeg \
    VIDEO_WATERMARK_FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf \
    API_PORT=8080
EXPOSE 8080
CMD ["sh","-c","java -jar app.jar --server.port=${PORT:-8080}"]
