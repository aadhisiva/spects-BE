import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from "typeorm";
  
  @Entity({name: "MasterData"})
  export class MasterData {
  
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ default: null,  type: 'nvarchar', length: 100 })
    SubCenterName!: string;

    @Column({ default: null,  type: 'nvarchar', length: 70 })
    DistrictCode!: string;

    @Column({ default: null,  type: 'nvarchar', length: 100 })
    TalukCode!: string;

    @Column({ default: null,  type: 'nvarchar', length: 150 })
    VillageName!: string;

    @Column({ default: null,  type: 'nvarchar', length: 150 })
    VillageCode!: string;

    @Column({ default: null,  type: 'nvarchar', length: 100 })
    DistrictName!: string;

    @Column({ default: null,  type: 'nvarchar', length: 100 })
    TalukName!: string;

    @Column({ default: null,  type: 'nvarchar', length: 100 })
    PhcoCode!: string;

    @Column({ default: null,  type: 'nvarchar', length: 100 })
    PhcoName!: string;

    @Column({ default: null,  type: 'nvarchar', length: 100 })
    UniqueCode!: string;

    @Column({ default: null,  type: 'nvarchar', length: 100 })
    Type!: string;
  
    @Column({ default: null,  type: 'nvarchar', length: 100 })
    SubCenterCode!: string;

    @CreateDateColumn()
    CreatedDate!: Date;
  };
  