import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from "typeorm";
  
  @Entity({name: "NewDistricts"})
  export class NewDistricts {
  
    @PrimaryGeneratedColumn()
    id!: number;
  
    @Column({default: null})
    oldDistrictName!: string;
  
    @Column()
    newDistrictName!: string;
  
    @CreateDateColumn()
    CreatedDate!: Date;
  
    @UpdateDateColumn()
    UpdatedDate!: Date;
  }
  