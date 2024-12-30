import {
    BadRequestException,
    NotFoundException,
    ConflictException,
    InternalServerErrorException,
  } from '@nestjs/common';
  
  export const PrismaErrorCode = Object.freeze({
    P2000: 'P2000',
    P2001: 'P2001',
    P2002: 'P2002',
    P2003: 'P2003',
    P2006: 'P2006',
    P2007: 'P2007',
    P2008: 'P2008',
    P2009: 'P2009',
    P2010: 'P2010',
    P2011: 'P2011',
    P2012: 'P2012',
    P2014: 'P2014',
    P2015: 'P2015',
    P2016: 'P2016',
    P2017: 'P2017',
    P2018: 'P2018',
    P2019: 'P2019',
    P2021: 'P2021',
    P2023: 'P2023',
    P2025: 'P2025',
    P2031: 'P2031',
    P2033: 'P2033',
    P2034: 'P2034',
    P2037: 'P2037',
    P1000: 'P1000',
    P1001: 'P1001',
    P1002: 'P1002',
    P1015: 'P1015',
    P1017: 'P1017',
  });
  
  export type PrismaErrorCode = keyof typeof PrismaErrorCode;
  
  
  interface PrismaErrorMeta {
    target?: string;
    model?: string;
    relationName?: string;
    details?: string;
  }
  
  export type operationT = 'create' | 'read' | 'update' | 'delete';
  
  export type PrismaErrorHandler = (
    operation: operationT,
    meta?: PrismaErrorMeta,
  ) => Error;
  
  export const ERROR_MAP: Record<PrismaErrorCode, PrismaErrorHandler> = {
      P2000: (_operation, meta) => new BadRequestException(
          `The provided value for ${meta?.target || 'a field'} is too long. Please use a shorter value.`
      ),

      P2001: (operation, meta) => new NotFoundException(
          `The ${meta?.model || 'record'} you are trying to ${operation} could not be found.`
      ),

      P2002: (operation, meta) => {
          const field = meta?.target || 'unique field';
          switch (operation) {
              case 'create':
                  return new ConflictException(
                      `A record with the same ${field} already exists. Please use a different value.`
                  );
              case 'update':
                  return new ConflictException(
                      `The new value for ${field} conflicts with an existing record.`
                  );
              default:
                  return new ConflictException(
                      `Unique constraint violation on ${field}.`
                  );
          }
      },

      P2003: (operation) => new BadRequestException(
          `Foreign key constraint failed. Unable to ${operation} the record because related data is invalid or missing.`
      ),

      P2006: (_operation, meta) => new BadRequestException(
          `The provided value for ${meta?.target || 'a field'} is invalid. Please correct it.`
      ),

      P2007: (operation) => new InternalServerErrorException(
          `Data validation error during ${operation}. Please ensure all inputs are valid and try again.`
      ),

      P2008: (operation) => new InternalServerErrorException(
          `Failed to query the database during ${operation}. Please try again later.`
      ),

      P2009: (operation) => new InternalServerErrorException(
          `Invalid data fetched during ${operation}. Check query structure.`
      ),

      P2010: () => new InternalServerErrorException(
          `Invalid raw query. Ensure your query is correct and try again.`
      ),

      P2011: (_operation, meta) => new BadRequestException(
          `The required field ${meta?.target || 'a field'} is missing. Please provide it to continue.`
      ),

      P2012: (operation, meta) => new BadRequestException(
          `Missing required relation ${meta?.relationName || ''}. Ensure all related data exists before ${operation}.`
      ),

      P2014: (operation) => {
          switch (operation) {
              case 'create':
                  return new BadRequestException(
                      `Cannot create record because the referenced data does not exist. Ensure related data exists.`
                  );
              case 'delete':
                  return new BadRequestException(
                      `Unable to delete record because it is linked to other data. Update or delete dependent records first.`
                  );
              default:
                  return new BadRequestException(`Foreign key constraint error.`);
          }
      },

      P2015: () => new InternalServerErrorException(
          `A record with the required ID was expected but not found. Please retry.`
      ),

      P2016: (operation) => new InternalServerErrorException(
          `Query ${operation} failed because the record could not be fetched. Ensure the query is correct.`
      ),

      P2017: (operation) => new InternalServerErrorException(
          `Connected records were not found for ${operation}. Check related data.`
      ),

      P2018: () => new InternalServerErrorException(
          `The required connection could not be established. Please check relationships.`
      ),

      P2019: (_operation, meta) => new InternalServerErrorException(
          `Invalid input for ${meta?.details || 'a field'}. Please ensure data conforms to expectations.`
      ),

      P2021: (_operation, meta) => new InternalServerErrorException(
          `The ${meta?.model || 'model'} was not found in the database.`
      ),

      P2025: (operation, meta) => new NotFoundException(
          `The ${meta?.model || 'record'} you are trying to ${operation} does not exist. It may have been deleted.`
      ),

      P2031: () => new InternalServerErrorException(
          `Invalid Prisma Client initialization error. Please check configuration.`
      ),

      P2033: (operation) => new InternalServerErrorException(
          `Insufficient database write permissions for ${operation}.`
      ),

      P2034: (operation) => new InternalServerErrorException(
          `Database read-only transaction failed during ${operation}.`
      ),

      P2037: (operation) => new InternalServerErrorException(
          `Unsupported combinations of input types for ${operation}. Please correct the query or input.`
      ),

      P1000: () => new InternalServerErrorException(
          `Database authentication failed. Verify your credentials and try again.`
      ),

      P1001: () => new InternalServerErrorException(
          `The database server could not be reached. Please check its availability.`
      ),

      P1002: () => new InternalServerErrorException(
          `Connection to the database timed out. Verify network connectivity and server availability.`
      ),

      P1015: (operation) => new InternalServerErrorException(
          `Migration failed. Unable to complete ${operation}. Check migration history or database state.`
      ),

      P1017: () => new InternalServerErrorException(
          `Database connection failed. Ensure the database is online and credentials are correct.`
      ),
      P2023: function (operation: operationT, meta?: PrismaErrorMeta): Error {
          throw new Error('Function not implemented.');
      }
  };
  