import { DataSource } from "typeorm";

const AppDataSource = new DataSource({
  type: "sqlite",
  database: './src/database/database.sqlite',
  entities: ["src/models/**/*.ts"],
  synchronize: true,
  logging: false,
}); 

export default AppDataSource