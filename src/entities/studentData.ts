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

@Entity({ name: "StudentData" })
export class StudentData {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  sats_id!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  school_id!: string;

  @ManyToOne(() => UserData, lr => lr.StudentDataFK)
  @JoinColumn({ name: "UserId" })
  UserId!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  student_name!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  order_number!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  dob!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  age!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  gender!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  father_name!: string;

  @Column({ default: null, type: 'text' })
  image!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  mother_name!: string;
  
  @Column({default: null, type: 'nvarchar', length: 100})
  applicationStatus!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  parent_phone_number!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  frame_type!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  frame_size!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  confirmation!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  left_eye_sph_plus!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  left_eye_sph_minus!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  left_eye_cyl_plus!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  left_eye_cyl_minus!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  left_eye_axis!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  left_eye_va!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  right_eye_sph_plus!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  right_eye_sph_minus!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  right_eye_cyl_plus!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  right_eye_cyl_minus!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  right_eye_axis!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  right_eye_va!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  state!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  district!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  village!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  hobly!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  type!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  status!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  near_vision_sph!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  near_vision_cyl!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  near_vision_axis!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  near_vision_va!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  refractionist_name!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  refractionist_mobile!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  class!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  section!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  oldUserId!: string;

  @CreateDateColumn()
  CreatedDate!: Date;

  @UpdateDateColumn()
  UpdatedDate!: Date;

};



