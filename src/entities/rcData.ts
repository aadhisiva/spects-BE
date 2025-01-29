import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity({ name: 'RcData'})
export class RcData {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ default: null, length: 100,  type: 'nvarchar' })
    benf_name!: string;

    @Column({ default: null, length: 100,  type: 'nvarchar' })
    dob!: string;

    @Column({default: null, length: 100,  type: 'nvarchar'})
    user_id!: string;

    @Column({ default: null, length: 100,  type: 'nvarchar' })
    taluk!: string;

    @Column({ default: null, type: 'int' })
    age!: number;

    @Column({ default: null, length: 100,  type: 'nvarchar' })
    district!: string;

    @Column({ default: null, length: 100,  type: 'nvarchar' })
    otp!: string;

    @Column({ default: null, length: 100,  type: 'nvarchar' })
    phone_number!: string;

    @Column({ default: null, length: 100,  type: 'nvarchar' })
    category!: string;

    @Column({ default: null, length: 100,  type: 'nvarchar' })
    caste!: string;

    @Column({ default: null, length: 100,  type: 'nvarchar' })
    gender!: string;

    @Column({ default: null, length: 100,  type: 'nvarchar' })
    education_id!: string;

    @Column({ default: null, length: 100,  type: 'nvarchar' })
    father_name!: string;

    @Column({ default: null, length: 100,  type: 'nvarchar' })
    address!: string;

    @Column({ default: null, length: 100,  type: 'nvarchar' })
    lgd_district!: string;

    @Column({ default: null, length: 100,  type: 'nvarchar' })
    lgd_taluka!: string;

    @Column({ default: null, length: 100,  type: 'nvarchar' })
    aadhar_no!: string;

    @Column({ default: null, length: 100,  type: 'nvarchar' })
    rc_no!: string;

    @CreateDateColumn()
    CreatedDate!: Date;

    @UpdateDateColumn()
    UpdatedDate!: Date;
}
