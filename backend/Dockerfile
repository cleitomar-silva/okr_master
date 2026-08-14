FROM php:8.3-cli

RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip libzip-dev libicu-dev libonig-dev \
    && docker-php-ext-install pdo_mysql mbstring zip intl pcntl \
    && apt-get clean && rm -rf /var/lib/apt/lists/* \
    && printf 'upload_max_filesize=50M\npost_max_size=64M\nmemory_limit=256M\n' > /usr/local/etc/php/conf.d/uploads.ini

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

RUN composer install --no-interaction --optimize-autoloader || true

EXPOSE 9192

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=9192"]