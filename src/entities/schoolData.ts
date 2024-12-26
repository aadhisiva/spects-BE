import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { UserData } from "./userData";

@Entity({ name: "SchoolData" })
export class SchoolData {
  
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({default: null, type: 'nvarchar', length: 100})
  school_id!: string;

  @Column({default: null, type: 'nvarchar', length: 100})
  h_block!: string;

  @ManyToOne(() => UserData, lr => lr.SchoolDataFK)
  @JoinColumn({ name: "UserId" })
  UserId!: string;

  @Column({default: null, type: 'nvarchar', length: 255})
  school_institute_name!: string;

  @Column({default: null, type: 'nvarchar', length: 255})
  school_incharge_name!: string;

  @Column({default: null, type: 'nvarchar', length: 100})
  school_mail!: string;

  @Column({default: null, type: 'nvarchar', length: 255})
  address!: string;

  @Column({default: null, type: 'nvarchar', length: 100})
  school_incharge_contact_no!: string;

  @Column({default: null, type: 'nvarchar', length: 100})
  village!: string;
  
  @Column({default: null, type: 'nvarchar', length: 100})
  taluk!: string;

  @Column({default: null, type: 'nvarchar', length: 100})
  district!: string;

  @Column({default: null, type: 'nvarchar', length: 100})
  applicationStatus!: string;

  @CreateDateColumn()
  CreatedDate!: Date;

  @UpdateDateColumn()
  UpdatedDate!: Date;

};



