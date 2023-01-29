# Image / OS
FROM php:8-apache-buster

ENV DEBIAN_FRONTEND noninteractive

# Apache
COPY apache2.conf /etc/apache2/
COPY ports.conf /etc/apache2/

RUN a2enmod headers
RUN a2enmod rewrite

# Turn off access logging
RUN sed -i 's/CustomLog ${APACHE_LOG_DIR}\/access.log combined/#CustomLog ${APACHE_LOG_DIR}\/access.log combined/' /etc/apache2/sites-available/000-default.conf
RUN sed -i 's/CustomLog ${APACHE_LOG_DIR}\/access.log combined/#CustomLog ${APACHE_LOG_DIR}\/access.log combined/' /etc/apache2/sites-available/default-ssl.conf
RUN sed -i 's/CustomLog ${APACHE_LOG_DIR}\/other_vhosts_access.log vhost_combined/#CustomLog ${APACHE_LOG_DIR}\/other_vhosts_access.log vhost_combined/' /etc/apache2/conf-available/other-vhosts-access-log.conf

# PHP - set production ini
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Restart Apache
RUN service apache2 restart
