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

  @Column({ default: null })
  student_unique_id: string;

  @Column({ default: null })
  sats_id: string;

  @Column({ default: null })
  school_id: string;

  @Column({ default: null })
  user_id: string;

  @Column({ default: null })
  student_name: string;

  @Column({ default: null })
  order_number: string;

  @Column({ default: null })
  dob: string;

  @Column({ default: null })
  age: string;

  @Column({ default: null })
  gender: string;

  @Column({ default: null })
  father_name: string;

  @Column('text', { default: null })
  image: string;

  @Column({ default: null })
  mother_name: string;

  @Column({ default: null })
  parent_phone_number: string;

  @Column({ default: null })
  left_eye_sph_plus: string;

  @Column({ default: null })
  left_eye_sph_minus: string;

  @Column({ default: null })
  left_eye_cyl_plus: string;

  @Column({ default: null })
  left_eye_cyl_minus: string;

  @Column({ default: null })
  left_eye_axis: string;

  @Column({ default: null })
  left_eye_va: string;

  @Column({ default: null })
  right_eye_sph_plus: string;

  @Column({ default: null })
  right_eye_sph_minus: string;

  @Column({ default: null })
  right_eye_cyl_plus: string;

  @Column({ default: null })
  right_eye_cyl_minus: string;

  @Column({ default: null })
  right_eye_axis: string;

  @Column({ default: null })
  right_eye_va: string;

  @Column({ default: null })
  state: string;

  @Column({ default: null })
  district: string;

  @Column({ default: null })
  village: string;

  @Column({ default: null })
  hobly: string;

  @Column({ default: null })
  type: string;

  @Column({ default: null })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
