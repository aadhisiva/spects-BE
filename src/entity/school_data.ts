import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from "typeorm";
  
  @Entity()
  export class school_data {
    constructor(data) {
      Object.assign(this, data);
    }
  
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({default: null})
    school_id: string;
  
    @Column({default: null})
    h_block: string;
  
    @Column({default: null})
    user_id: string;
  
    @Column({default: null})
    school_unique_id: string;
  
    @Column({default: null})
    school_institute_name: string;
  
    @Column({default: null})
    school_incharge_name: string;
  
    @Column({default: null})
    school_mail: string;
  
    @Column({default: null})
    address: string;
  
    @Column({default: null})
    school_incharge_contact_no: string;
  
    @Column({default: null})
    village: string;
    
    @Column({default: null})
    taluk: string;
  
    @Column({default: null})
    district: string;

    @Column({ default: 0 })
    status: string;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  }