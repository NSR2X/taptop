import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key'
    DEBUG = False
    SHOW_ADS = True  # Add this line

class DevelopmentConfig(Config):
    DEBUG = True
    SHOW_ADS = False  # Disable ads in development

class ProductionConfig(Config):
    SHOW_ADS = True  # Enable ads in production

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}