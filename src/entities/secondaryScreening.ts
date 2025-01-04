import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from "typeorm";
  
  @Entity({name: "SecondaryScreening"})
  export class SecondaryScreening {
  
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ default: null,  type: 'nvarchar', length: 70 })
    DistrictCode!: string;

    @Column({ default: null,  type: 'nvarchar', length: 100 })
    TalukCode!: string;

    @Column({ default: null,  type: 'nvarchar', length: 100 })
    PhcoCode!: string;

    @Column({ default: null,  type: 'nvarchar', length: 100 })
    UniqueCode!: string;

    @Column({ default: null,  type: 'nvarchar', length: 100 })
    Type!: string;
  
    @Column({ default: null,  type: 'nvarchar', length: 100 })
    SubCenterCode!: string;
  
    @Column({ default: null,  type: 'nvarchar', length: 100 })
    TotalPSCompleted!: string;
  
    @Column({ default: null,  type: 'nvarchar', length: 100 })
    TotalSSRequired!: string;

    @CreateDateColumn()
    CreatedDate!: Date;

    @UpdateDateColumn()
    UpdatedDate!: Date;
  };
  