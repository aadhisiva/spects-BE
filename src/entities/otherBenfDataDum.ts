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

@Entity({ name: "OtherBenfDataDummy" })
export class OtherBenfDataDummy {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  benf_name!: string;

  @Column({ default: null, type: 'nvarchar', length: 20 })
  dob!: string;

  @ManyToOne(() => UserData, lr => lr.OtherBenfDataFK)
  @JoinColumn({ name: "UserId" })
  UserId!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  taluk!: string;

  @Column({ default: null, type: 'text' })
  image!: string;

  @Column({ default: null, type: 'int' })
  age!: number;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  district!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  otp!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  deliveredOtp!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  phone_number!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  category!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  caste!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  order_number!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  gender!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  education_id!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  father_name!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  address!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  aadhar_no!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  rc_no!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  type!: string;

  @Column({ default: null, type: 'nvarchar', length: 255 })
  details!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  kutumba_phone_number!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  scheme_eligability!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  frame_type!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  concent_check!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  frame_size!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  applicationStatus!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  lgd_district!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  lgd_taluka!: string;

  @Column({ default: null, type: 'text' })
  initial_image!: string;

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
  near_vision_sph!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  near_vision_cyl!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  near_vision_axis!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  near_vision_va!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  status!: string;

  @Column({ default: "N", type: 'nvarchar', length: 100 })
  ekyc_check!: string;

  @Column({ default: null, type: 'nvarchar', length: 255 })
  remarks!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  refractionist_name!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  refractionist_mobile!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  class!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  section!: string;

  @Column({ default: null, type: 'nvarchar', length: 100 })
  schoolName!: string;

  @CreateDateColumn()
  CreatedDate!: Date;

  @UpdateDateColumn()
  UpdatedDate!: Date;

};



