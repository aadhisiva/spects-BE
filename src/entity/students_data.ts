import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class students_data {
  constructor(data) {
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '' })
  student_unique_id: string;

  @Column({ default: '' })
  sats_id: string;

  @Column({ default: '' })
  school_id: string;

  @Column({ default: '' })
  user_id: string;

  @Column({ default: '' })
  student_name: string;

  @Column({ default: '' })
  order_number: string;

  @Column({ default: '' })
  dob: string;

  @Column({ default: '' })
  age: string;

  @Column({ default: '' })
  gender: string;

  @Column({ default: '' })
  father_name: string;

  @Column('text', { default: '' })
  image: string;

  @Column({ default: '' })
  mother_name: string;
  
  @Column({default: ''})
  applicationStatus: string;

  @Column({ default: '' })
  parent_phone_number: string;

  @Column({ default: '' })
  frame_type: string;

  @Column({ default: '' })
  frame_size: string;

  @Column({ default: '' })
  confirmation: string;

  @Column({ default: '' })
  left_eye_sph_plus: string;

  @Column({ default: '' })
  left_eye_sph_minus: string;

  @Column({ default: '' })
  left_eye_cyl_plus: string;

  @Column({ default: '' })
  left_eye_cyl_minus: string;

  @Column({ default: '' })
  left_eye_axis: string;

  @Column({ default: '' })
  left_eye_va: string;

  @Column({ default: '' })
  right_eye_sph_plus: string;

  @Column({ default: '' })
  right_eye_sph_minus: string;

  @Column({ default: '' })
  right_eye_cyl_plus: string;

  @Column({ default: '' })
  right_eye_cyl_minus: string;

  @Column({ default: '' })
  right_eye_axis: string;

  @Column({ default: '' })
  right_eye_va: string;

  @Column({ default: '' })
  state: string;

  @Column({ default: '' })
  district: string;

  @Column({ default: '' })
  village: string;

  @Column({ default: '' })
  hobly: string;

  @Column({ default: '' })
  type: string;

  @Column({ default: '' })
  status: string;

  @Column({ default: '' })
  near_vision_sph: string;

  @Column({ default: '' })
  near_vision_cyl: string;

  @Column({ default: '' })
  near_vision_axis: string;

  @Column({ default: '' })
  near_vision_va: string;

  @Column({ default: "" })
  refractionist_name: string;

  @Column({ default: "" })
  refractionist_mobile: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
