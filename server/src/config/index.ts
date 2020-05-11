import Bluebird from 'bluebird';
import Debug    from 'debug';
import logger   from '../util/logger';
import Mongoose from 'mongoose';

const debug = Debug('mongo');

Bluebird.config({
  // As much as we like to be warned about our runaway promises, most of the
  // offending code lives in libraries we use. We still need to make sense
  // of our logs.
  warnings: false
});

Mongoose.Promise = global.Promise;


export function getMongoURI(): string {
  switch (process.env.NODE_ENV) {
    case 'production': {
      if (process.env.MONGODB_URI)
        return process.env.MONGODB_URI;
      else
        throw new Error('MONGODB_URI not defined');
    }
    case 'test': {
      const host = process.env.MONGODB_HOST || 'localhost';
      const port = process.env.MONGODB_PORT || 27017;

      return `mongodb://${host}:${port}/test-fogon`;
    }
    default: {
      const host = process.env.MONGODB_HOST || 'localhost';
      const port = process.env.MONGODB_PORT || 27017;

      return `mongodb://${host}:${port}/broadly`;
    }
  }
}

export function configure(): void {
  const uri    = getMongoURI();
  const Logger = Mongoose.mongo.Logger;

  Mongoose.connection
    .on('connected', function() {
      logger.info(`MongoDB: connected to ${uri}`);
    })
    .on('disconnected', function() {
      logger.warn('MongoDB: disconnected');
    })
    .on('reconnected', function() {
      logger.warn(`MongoDB: reconnected to ${uri}`);
    })
    .on('fullsetup', function() {
      logger.info('MongoDB: fullsetup');
    })
    .on('error', logger.error);

  Mongoose.connect(uri, { useNewUrlParser: true });

  // Mongoose debug to Papertrail.
  Mongoose.set('debug', debug);

  Logger.setLevel(debug.enabled ? 'debug' : 'warn');
}
