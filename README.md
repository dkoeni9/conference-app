# Production Setup

```bash
sudo apt update
sudo apt install python3 python3-venv python3-pip nginx git -y

export PATH=$PATH:/usr/sbin

cd /opt
sudo git clone https://github.com/dkoeni9/conference-app.git conference
sudo chown -R $USER:$USER /opt/conference
cd conference

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

## Configuration File

```bash
cp config.example.json config.json      # DEBUG = False
```

Example:

```JSON
{
  "SECRET_KEY": "your-secret-key",
  "DEBUG": false,
  "HOST_NAME": "conference.local"
}
```

## Migration & Static Files

```bash
python manage.py migrate
python manage.py collectstatic
```

## systemd (Daphne)

```bash
sudo nano /etc/systemd/system/daphne.service
```

```ini
[Unit]
Description=Daphne ASGI Server
After=network.target

[Service]
User=YOUR_USER      # Replace YOUR_USER with your user (www-data)
Group=YOUR_USER     # Replace YOUR_USER with your user (www-data)
WorkingDirectory=/opt/conference
Environment="DJANGO_SETTINGS_MODULE=conference.settings"
ExecStart=/opt/conference/venv/bin/daphne -b 0.0.0.0 -p 8001 conference.asgi:application

Restart=always

[Install]
WantedBy=multi-user.target
```

### Launch

```bash
sudo systemctl daemon-reload
sudo systemctl enable daphne
sudo systemctl start daphne
sudo systemctl status daphne
```

## Nginx

Get IP address:

```bash
hostname -I
# or
ip addr show
```

### Configration:

```bash
sudo nano /etc/nginx/sites-available/conference
```

```nginx
server {
    listen 80;
    server_name HOST_IP conference.local;       # Replace HOST_IP

    location /static/ {
        alias /opt/conference/static/;
    }

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80 default_server;
    return 444;
}

```

### hosts File

```bash
sudo nano /etc/hosts
```

```hosts
HOST_IP      conference.local       # Replace HOST_IP
```

### Activation

```bash
ls -l /etc/nginx/sites-enabled/

sudo ln -s /etc/nginx/sites-available/conference /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl restart nginx
```

## Update

```bash
cd /opt/conference
sudo systemctl stop daphne

git pull

source venv/bin/activate
pip install -r requirements.txt

python manage.py migrate
python manage.py collectstatic --clear

sudo systemctl start daphne
sudo systemctl status daphne

# Single User mode
cd /opt/conference

git fetch origin

git checkout single-user-mode
git pull

source venv/bin/activate
pip install -r requirements.txt

python manage.py migrate
python manage.py collectstatic

sudo systemctl restart daphne

# nginx
sudo nginx -t
sudo systemctl restart nginx
```

# Development Setup

```bash
sudo git clone https://github.com/dkoeni9/conference-app.git conference
cd conference

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt

cp config.example.json config.json      # DEBUG = True

python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```
