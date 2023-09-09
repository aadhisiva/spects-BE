import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryColumn,
    ManyToOne,
  } from "typeorm";
  
  @Entity()
  export class school_data {
    constructor(data) {
      Object.assign(this, data);
    }
  
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({default: ''})
    school_id: string;
  
    @Column({default: ''})
    h_block: string;
  
    @Column({default: ''})
    user_id: string;
  
    @Column({default: ''})
    school_unique_id: string;
  
    @Column({default: ''})
    school_institute_name: string;
  
    @Column({default: ''})
    school_incharge_name: string;
  
    @Column({default: ''})
    school_mail: string;
  
    @Column({default: ''})
    address: string;
  
    @Column({default: ''})
    school_incharge_contact_no: string;
  
    @Column({default: ''})
    village: string;
    
    @Column({default: ''})
    taluk: string;
  
    @Column({default: ''})
    district: string;
  
    @Column({default: ''})
    applicationStatus: string;

    // @Column({ default: 0 })
    // status: string;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;

    // @ManyToOne()
  }