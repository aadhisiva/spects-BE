import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from "typeorm";
  
  @Entity()
  export class master_data {
    constructor(data) {
      Object.assign(this, data);
    }
  
    @PrimaryGeneratedColumn()
    id: number;
   
    @Column({default: null})
    user_unique_id: string;
    
    @Column({default: null})
    district: string;
    
    @Column({default: null})
    taluka: string;

    @Column({default: null})
    health_block: string;
  
    @Column({default: null})
    health_facility: string;
  
    @Column({default: null})
    sub_centre: string;
    
    @Column({default: null})
    district_code: string;
    
    @Column({default: null})
    health_facility_code: string;
    
    @Column({default: null})
    sub_centre_code: string;
    
    @Column({default: null})
    taluka_code: string;
    
    @Column({default: null})
    village: string;

    @Column({default: null})
    rural_urban: string;

    @Column({default: null})
    refractionist_name: string;

    @Column({default: null})
    refractionist_mobile: string;

    @Column({default: null})
    ngo_gov: string;

    @Column({default: null})
    unique_id: string;

    @Column({default: null})
    village_unique: string;

    @Column({default: null})
    total_primary_screening_completed: string;

    @Column({default: null})
    total_secondary_screening_required: string;

    @Column({default: null})
    multiple: string;

    @Column({default: null})
    otp: string;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  }
  